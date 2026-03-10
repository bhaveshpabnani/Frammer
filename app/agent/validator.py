"""Semantic validation for agent plans."""
from __future__ import annotations

from dataclasses import dataclass

from app.agent.schemas import AgentPlan, AgentValidationIssue
from app.core.config import get_settings
from app.registry.dimensions import DIMENSION_REGISTRY
from app.registry.metrics import METRIC_REGISTRY, MetricDef

_UNSUPPORTED_METRICS = frozenset({"mom_growth_pct", "health_score", "productivity_index"})
_MAX_DIMENSIONS = 2
_VALID_DATE_RANGES = frozenset({"last_7d", "last_30d", "last_90d", "this_month", "last_month", "ytd", "all", "all_data", "custom"})
settings = get_settings()


@dataclass(frozen=True)
class ValidationResult:
    plan: AgentPlan
    caveats: list[str]
    follow_ups: list[str]
    issues: list[AgentValidationIssue]

    @property
    def is_valid(self) -> bool:
        return not self.issues


class AgentPlanValidator:
    """Registry-backed validator for semantic plans."""

    def validate(self, plan: AgentPlan) -> ValidationResult:
        issues: list[AgentValidationIssue] = []
        caveats: list[str] = []
        follow_ups: list[str] = []
        metric_time_columns: set[str] = set()

        if len(plan.dimensions) > _MAX_DIMENSIONS:
            issues.append(AgentValidationIssue(
                field="dimensions",
                code="too_many_dimensions",
                message="The MVP compiler supports up to 2 dimensions per query.",
            ))

        if plan.limit > settings.AGENT_MAX_LIMIT:
            issues.append(AgentValidationIssue(
                field="limit",
                code="limit_too_high",
                message=f"limit must be <= {settings.AGENT_MAX_LIMIT}.",
            ))

        date_range = plan.filters.get("date_range")
        if date_range is not None and date_range not in _VALID_DATE_RANGES:
            issues.append(AgentValidationIssue(
                field="filters.date_range",
                code="invalid_date_range",
                message=f"Unsupported date_range '{date_range}'.",
            ))

        if plan.compare_mode is not None and not plan.filters.get("date_range"):
            issues.append(AgentValidationIssue(
                field="compare_mode",
                code="missing_date_range",
                message="Comparison mode requires a resolved date_range filter.",
            ))

        for metric_name in plan.metrics:
            metric_def = METRIC_REGISTRY.get(metric_name)
            if metric_def is None:
                issues.append(AgentValidationIssue(
                    field="metrics",
                    code="unknown_metric",
                    message=f"Metric '{metric_name}' is not registered.",
                ))
                continue

            if metric_name in _UNSUPPORTED_METRICS:
                issues.append(AgentValidationIssue(
                    field="metrics",
                    code="metric_not_compilable",
                    message=f"Metric '{metric_name}' requires a dedicated query builder and is not in the generic compiler yet.",
                ))
                continue

            metric_time_columns.add(metric_def.default_time_column)
            caveats.extend(self._metric_caveats(metric_def))
            for dimension_name in plan.dimensions:
                if not self._is_dimension_allowed(metric_def, dimension_name):
                    issues.append(AgentValidationIssue(
                        field="dimensions",
                        code="invalid_dimension_for_metric",
                        message=f"Metric '{metric_name}' cannot be sliced by '{dimension_name}'.",
                    ))

            if plan.time_grain not in metric_def.valid_time_grains:
                issues.append(AgentValidationIssue(
                    field="time_grain",
                    code="invalid_time_grain",
                    message=f"Metric '{metric_name}' does not support time grain '{plan.time_grain}'.",
                ))

        for dimension_name in plan.dimensions:
            if dimension_name not in DIMENSION_REGISTRY:
                issues.append(AgentValidationIssue(
                    field="dimensions",
                    code="unknown_dimension",
                    message=f"Dimension '{dimension_name}' is not registered.",
                ))

        if not plan.metrics:
            issues.append(AgentValidationIssue(
                field="metrics",
                code="missing_metric",
                message="At least one metric is required.",
            ))

        if len(metric_time_columns) > 1 and (
            plan.time_grain != "all" or plan.filters.get("date_range")
        ):
            issues.append(AgentValidationIssue(
                field="metrics",
                code="mixed_time_anchors",
                message="Selected metrics use different default time anchors and cannot share one time window in the generic compiler.",
            ))

        allowed_sort_fields = set(plan.metrics) | set(plan.dimensions) | {"time"}
        if plan.compare_mode:
            for metric_name in plan.metrics:
                allowed_sort_fields.add(f"comparison_{metric_name}")
                allowed_sort_fields.add(f"delta_{metric_name}_pct")
        for sort_rule in plan.order_by:
            if sort_rule.field not in allowed_sort_fields:
                issues.append(AgentValidationIssue(
                    field="order_by",
                    code="unknown_sort_field",
                    message=f"Sort field '{sort_rule.field}' is not part of the selected result shape.",
                ))

        if plan.chart is not None:
            allowed_fields = set(plan.metrics) | set(plan.dimensions) | {"time"}
            if plan.chart.x and plan.chart.x not in allowed_fields:
                issues.append(AgentValidationIssue(
                    field="chart.x",
                    code="unknown_chart_field",
                    message=f"Chart x field '{plan.chart.x}' is not present in the plan output.",
                ))
            if plan.chart.y and plan.chart.y not in allowed_fields:
                issues.append(AgentValidationIssue(
                    field="chart.y",
                    code="unknown_chart_field",
                    message=f"Chart y field '{plan.chart.y}' is not present in the plan output.",
                ))

        if plan.intent == "explain_metric" and plan.metrics:
            follow_ups.append(f"Ask for a trend of {plan.metrics[0]} over time.")
        elif plan.dimensions and plan.metrics:
            follow_ups.append(f"Break down {plan.metrics[0]} by a different dimension.")
        elif plan.metrics:
            follow_ups.append(f"Show {plan.metrics[0]} by client.")

        return ValidationResult(
            plan=plan,
            caveats=list(dict.fromkeys(item for item in caveats if item)),
            follow_ups=list(dict.fromkeys(follow_ups)),
            issues=issues,
        )

    def _is_dimension_allowed(self, metric_def: MetricDef, dimension_name: str) -> bool:
        if metric_def.name == "dq_score":
            return False
        if not metric_def.valid_dimensions:
            return True
        return dimension_name in metric_def.valid_dimensions

    def _metric_caveats(self, metric_def: MetricDef) -> list[str]:
        caveats: list[str] = []
        if metric_def.caveats:
            caveats.append(metric_def.caveats)
        if metric_def.is_proxy and metric_def.proxy_note:
            caveats.append(metric_def.proxy_note)
        return caveats
