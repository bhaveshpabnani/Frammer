"""POST /api/v1/agent/* semantic analytics endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.audit import agent_audit_logger, agent_execution_cache, build_agent_cache_key
from app.agent.chart_planner import AgentChartPlanner
from app.agent.executor import AgentExecutor
from app.agent.llm_planner import AgentPlanner
from app.agent.scope import resolve_plan_scope
from app.agent.schemas import (
    AgentExecuteRequest,
    AgentPlan,
    AgentPlanResult,
    AgentQueryRequest,
    AgentQueryResponse,
)
from app.agent.sql_compiler import AgentSQLCompiler
from app.agent.summarizer import AgentSummarizer
from app.agent.validator import AgentPlanValidator
from app.api.deps import FilterParams, get_current_user, get_db
from app.registry.metrics import METRIC_REGISTRY
from app.schemas.responses import ApiResponse, ResponseMetadata

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger(__name__)

_planner = AgentPlanner()
_validator = AgentPlanValidator()
_compiler = AgentSQLCompiler()
_executor = AgentExecutor()
_chart_planner = AgentChartPlanner()
_summarizer = AgentSummarizer()


@router.post("/plan", response_model=ApiResponse[AgentPlanResult])
async def plan_query(
    body: AgentQueryRequest,
    f: FilterParams = Depends(),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ApiResponse[AgentPlanResult]:
    base_scope = resolve_plan_scope(
        plan=body.plan or AgentPlan(intent="diagnostic"),
        context=body.context,
        filter_params=f,
        current_user=current_user,
    )
    planned = await _planner.plan(
        body.question,
        supplied_plan=body.plan,
        base_filters=base_scope.plan.filters,
        allowed_client_slugs=base_scope.allowed_client_slugs,
    )
    resolved_scope = resolve_plan_scope(
        plan=planned.plan,
        context=body.context,
        filter_params=f,
        current_user=current_user,
    )
    validation = _validator.validate(resolved_scope.plan)
    data = AgentPlanResult(
        question=body.question,
        interpreted_question=planned.interpreted_question,
        plan=validation.plan,
        resolved_filters=resolved_scope.metadata_filters,
        planner_source=planned.planner_source,
        planner_model=planned.planner_model,
        planner_confidence=planned.planner_confidence,
        planner_fallback_reason=planned.planner_fallback_reason,
        caveats=validation.caveats,
        follow_ups=validation.follow_ups,
        validation_issues=validation.issues,
    )
    audit_id = agent_audit_logger.record(
        {
            "endpoint": "agent.plan",
            "status": "planned" if validation.is_valid else "validation_failed",
            "question": body.question,
            "interpreted_question": planned.interpreted_question,
            "plan": validation.plan.model_dump(mode="json"),
            "resolved_filters": resolved_scope.metadata_filters,
            "planner_source": planned.planner_source,
            "planner_model": planned.planner_model,
            "planner_confidence": planned.planner_confidence,
            "planner_fallback_reason": planned.planner_fallback_reason,
            "validation_issues": [issue.model_dump() for issue in validation.issues],
        }
    )
    return ApiResponse(
        data=data,
        meta=_build_agent_metadata(
            resolved_scope.metadata_filters,
            validation.plan,
            "agent-plan",
            validation.caveats,
            planner_source=planned.planner_source,
            planner_model=planned.planner_model,
            planner_confidence=planned.planner_confidence,
            planner_fallback_reason=planned.planner_fallback_reason,
            audit_id=audit_id,
        ),
    )


@router.post("/execute", response_model=ApiResponse[AgentQueryResponse])
async def execute_plan(
    body: AgentExecuteRequest,
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ApiResponse[AgentQueryResponse]:
    resolved_scope = resolve_plan_scope(
        plan=body.plan,
        context=body.context,
        filter_params=f,
        current_user=current_user,
    )
    validation = _validator.validate(resolved_scope.plan)
    if not validation.is_valid:
        agent_audit_logger.record(
            {
                "endpoint": "agent.execute",
                "status": "validation_failed",
                "question": body.question,
                "plan": validation.plan.model_dump(mode="json"),
                "resolved_filters": resolved_scope.metadata_filters,
                "validation_issues": [issue.model_dump() for issue in validation.issues],
            }
        )
        raise HTTPException(
            status_code=422,
            detail=[issue.model_dump() for issue in validation.issues],
        )

    cache_key = build_agent_cache_key(
        scope="execute",
        plan=validation.plan.model_dump(mode="json"),
        allowed_client_slugs=resolved_scope.allowed_client_slugs,
    )
    cache_hit = False
    if validation.plan.intent == "explain_metric":
        response = _build_explainer_response(
            question=body.question or "",
            plan=validation.plan,
            resolved_filters=resolved_scope.metadata_filters,
            caveats=validation.caveats,
            follow_ups=validation.follow_ups,
        )
    else:
        cached_response = agent_execution_cache.get(cache_key)
        if cached_response is not None:
            cache_hit = True
            response = AgentQueryResponse.model_validate(cached_response).model_copy(
                update={
                    "question": body.question or "",
                    "interpreted_question": body.question or "",
                    "plan": validation.plan,
                    "resolved_filters": resolved_scope.metadata_filters,
                }
            )
        else:
            try:
                compiled = _compiler.compile(
                    validation.plan,
                    allowed_client_slugs=resolved_scope.allowed_client_slugs,
                )
                columns, rows, elapsed_ms = await _executor.execute(db, compiled)
                response = AgentQueryResponse(
                    question=body.question or "",
                    interpreted_question=body.question or "",
                    plan=validation.plan,
                    resolved_filters=resolved_scope.metadata_filters,
                    planner_source="supplied_plan",
                    planner_model=None,
                    planner_confidence=1.0,
                    planner_fallback_reason=None,
                    sql=compiled.sql,
                    sql_params=compiled.params,
                    columns=columns,
                    rows=rows,
                    chart_spec=_chart_planner.build_chart_spec(validation.plan, columns, rows),
                    summary=_summarizer.summarize(validation.plan, columns, rows),
                    caveats=validation.caveats,
                    follow_ups=validation.follow_ups,
                    execution_time_ms=elapsed_ms,
                    row_count=len(rows),
                )
                agent_execution_cache.set(cache_key, response.model_dump(mode="json"))
            except Exception as exc:
                audit_id = agent_audit_logger.record(
                    {
                        "endpoint": "agent.execute",
                        "status": "execution_failed",
                        "question": body.question,
                        "plan": validation.plan.model_dump(mode="json"),
                        "resolved_filters": resolved_scope.metadata_filters,
                        "error_type": type(exc).__name__,
                        "error_message": str(exc),
                    }
                )
                logger.exception("agent_execute_failed audit_id=%s", audit_id)
                raise

    audit_id = agent_audit_logger.record(
        {
            "endpoint": "agent.execute",
            "status": "success",
            "question": body.question,
            "plan": validation.plan.model_dump(mode="json"),
            "resolved_filters": resolved_scope.metadata_filters,
            "planner_source": response.planner_source,
            "planner_model": response.planner_model,
            "planner_confidence": response.planner_confidence,
            "planner_fallback_reason": response.planner_fallback_reason,
            "sql": response.sql,
            "execution_time_ms": response.execution_time_ms,
            "row_count": response.row_count,
            "cache_hit": cache_hit,
            "validation_issues": [],
        }
    )

    return ApiResponse(
        data=response,
        meta=_build_agent_metadata(
            resolved_scope.metadata_filters,
            validation.plan,
            "agent-query",
            validation.caveats,
            planner_source=response.planner_source,
            planner_model=response.planner_model,
            planner_confidence=response.planner_confidence,
            planner_fallback_reason=response.planner_fallback_reason,
            cache_hit=cache_hit,
            audit_id=audit_id,
        ),
    )


@router.post("/query", response_model=ApiResponse[AgentQueryResponse])
async def query_agent(
    body: AgentQueryRequest,
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ApiResponse[AgentQueryResponse]:
    base_scope = resolve_plan_scope(
        plan=body.plan or AgentPlan(intent="diagnostic"),
        context=body.context,
        filter_params=f,
        current_user=current_user,
    )
    planned = await _planner.plan(
        body.question,
        supplied_plan=body.plan,
        base_filters=base_scope.plan.filters,
        allowed_client_slugs=base_scope.allowed_client_slugs,
    )
    resolved_scope = resolve_plan_scope(
        plan=planned.plan,
        context=body.context,
        filter_params=f,
        current_user=current_user,
    )
    validation = _validator.validate(resolved_scope.plan)
    if not validation.is_valid:
        agent_audit_logger.record(
            {
                "endpoint": "agent.query",
                "status": "validation_failed",
                "question": body.question,
                "interpreted_question": planned.interpreted_question,
                "plan": validation.plan.model_dump(mode="json"),
                "resolved_filters": resolved_scope.metadata_filters,
                "planner_source": planned.planner_source,
                "planner_model": planned.planner_model,
                "planner_confidence": planned.planner_confidence,
                "planner_fallback_reason": planned.planner_fallback_reason,
                "validation_issues": [issue.model_dump() for issue in validation.issues],
            }
        )
        raise HTTPException(
            status_code=422,
            detail=[issue.model_dump() for issue in validation.issues],
        )

    cache_key = build_agent_cache_key(
        scope="query",
        plan=validation.plan.model_dump(mode="json"),
        allowed_client_slugs=resolved_scope.allowed_client_slugs,
    )
    cache_hit = False
    if validation.plan.intent == "explain_metric":
        response = _build_explainer_response(
            question=body.question,
            plan=validation.plan,
            resolved_filters=resolved_scope.metadata_filters,
            caveats=validation.caveats,
            follow_ups=validation.follow_ups,
            planner_source=planned.planner_source,
            planner_model=planned.planner_model,
            planner_confidence=planned.planner_confidence,
            planner_fallback_reason=planned.planner_fallback_reason,
        )
    else:
        cached_response = agent_execution_cache.get(cache_key)
        if cached_response is not None:
            cache_hit = True
            response = AgentQueryResponse.model_validate(cached_response).model_copy(
                update={
                    "question": body.question,
                    "interpreted_question": planned.interpreted_question,
                    "plan": validation.plan,
                    "resolved_filters": resolved_scope.metadata_filters,
                    "planner_source": planned.planner_source,
                    "planner_model": planned.planner_model,
                    "planner_confidence": planned.planner_confidence,
                    "planner_fallback_reason": planned.planner_fallback_reason,
                }
            )
        else:
            try:
                compiled = _compiler.compile(
                    validation.plan,
                    allowed_client_slugs=resolved_scope.allowed_client_slugs,
                )
                columns, rows, elapsed_ms = await _executor.execute(db, compiled)
                response = AgentQueryResponse(
                    question=body.question,
                    interpreted_question=planned.interpreted_question,
                    plan=validation.plan,
                    resolved_filters=resolved_scope.metadata_filters,
                    planner_source=planned.planner_source,
                    planner_model=planned.planner_model,
                    planner_confidence=planned.planner_confidence,
                    planner_fallback_reason=planned.planner_fallback_reason,
                    sql=compiled.sql,
                    sql_params=compiled.params,
                    columns=columns,
                    rows=rows,
                    chart_spec=_chart_planner.build_chart_spec(validation.plan, columns, rows),
                    summary=_summarizer.summarize(validation.plan, columns, rows),
                    caveats=validation.caveats,
                    follow_ups=validation.follow_ups,
                    execution_time_ms=elapsed_ms,
                    row_count=len(rows),
                )
                agent_execution_cache.set(cache_key, response.model_dump(mode="json"))
            except Exception as exc:
                audit_id = agent_audit_logger.record(
                    {
                        "endpoint": "agent.query",
                        "status": "execution_failed",
                        "question": body.question,
                        "interpreted_question": planned.interpreted_question,
                        "plan": validation.plan.model_dump(mode="json"),
                        "resolved_filters": resolved_scope.metadata_filters,
                        "planner_source": planned.planner_source,
                        "planner_model": planned.planner_model,
                        "planner_confidence": planned.planner_confidence,
                        "planner_fallback_reason": planned.planner_fallback_reason,
                        "error_type": type(exc).__name__,
                        "error_message": str(exc),
                    }
                )
                logger.exception("agent_query_failed audit_id=%s", audit_id)
                raise

    audit_id = agent_audit_logger.record(
        {
            "endpoint": "agent.query",
            "status": "success",
            "question": body.question,
            "interpreted_question": planned.interpreted_question,
            "plan": validation.plan.model_dump(mode="json"),
            "resolved_filters": resolved_scope.metadata_filters,
            "planner_source": response.planner_source,
            "planner_model": response.planner_model,
            "planner_confidence": response.planner_confidence,
            "planner_fallback_reason": response.planner_fallback_reason,
            "sql": response.sql,
            "execution_time_ms": response.execution_time_ms,
            "row_count": response.row_count,
            "cache_hit": cache_hit,
            "validation_issues": [],
        }
    )

    return ApiResponse(
        data=response,
        meta=_build_agent_metadata(
            resolved_scope.metadata_filters,
            validation.plan,
            "agent-query",
            validation.caveats,
            planner_source=response.planner_source,
            planner_model=response.planner_model,
            planner_confidence=response.planner_confidence,
            planner_fallback_reason=response.planner_fallback_reason,
            cache_hit=cache_hit,
            audit_id=audit_id,
        ),
    )


def _build_explainer_response(
    *,
    question: str,
    plan: AgentPlan,
    resolved_filters: dict[str, Any],
    caveats: list[str],
    follow_ups: list[str],
    planner_source: str = "supplied_plan",
    planner_model: str | None = None,
    planner_confidence: float | None = None,
    planner_fallback_reason: str | None = None,
) -> AgentQueryResponse:
    metric_name = plan.metrics[0]
    metric = METRIC_REGISTRY[metric_name]
    summary = metric.label
    if metric.numerator and metric.denominator:
        summary += f": {metric.numerator} divided by {metric.denominator}."
    elif metric.caveats:
        summary += f": {metric.caveats}"
    return AgentQueryResponse(
        question=question,
        interpreted_question=question,
        plan=plan,
        resolved_filters=resolved_filters,
        planner_source=planner_source,
        planner_model=planner_model,
        planner_confidence=planner_confidence,
        planner_fallback_reason=planner_fallback_reason,
        sql=None,
        sql_params={},
        columns=[],
        rows=[],
        chart_spec=None,
        summary=summary,
        caveats=caveats,
        follow_ups=follow_ups,
        execution_time_ms=0.0,
        row_count=0,
    )
def _build_agent_metadata(
    resolved_filters: dict[str, Any],
    plan: AgentPlan,
    grain: str,
    caveats: list[str],
    *,
    planner_source: str | None = None,
    planner_model: str | None = None,
    planner_confidence: float | None = None,
    planner_fallback_reason: str | None = None,
    cache_hit: bool | None = None,
    audit_id: str | None = None,
) -> ResponseMetadata:
    return ResponseMetadata(
        filters_applied=resolved_filters,
        generated_at=datetime.now(timezone.utc).isoformat(),
        metric_definitions_used=plan.metrics,
        source_grain=grain,
        caveats=caveats,
        unit=None,
        currency=None,
        planner_source=planner_source,
        planner_model=planner_model,
        planner_confidence=planner_confidence,
        planner_fallback_reason=planner_fallback_reason,
        cache_hit=cache_hit,
        audit_id=audit_id,
    )
