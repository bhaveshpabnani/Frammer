"""Deterministic planner that turns plain-English analytics asks into AgentPlan."""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.agent.schemas import AgentPlan, ChartRequest, SortRule
from app.registry.dimensions import DIMENSION_REGISTRY
from app.registry.metrics import METRIC_REGISTRY

_METRIC_ALIASES: dict[str, tuple[str, ...]] = {
    "total_uploaded": ("total uploaded", "uploads", "uploaded count", "uploaded videos"),
    "total_published": ("total published", "published count", "published videos"),
    "total_processed": ("total processed", "processed count", "processed videos"),
    "total_clips_created": ("clips created", "total clips", "total created clips"),
    "total_clips_published": ("clips published", "published clips"),
    "publish_rate": ("publish rate", "publishing rate", "conversion rate"),
    "processing_rate": ("processing rate",),
    "avg_clips_per_video": ("avg clips per video", "average clips per video"),
    "uploaded_duration_hrs": ("uploaded duration", "upload hours", "uploaded hours"),
    "created_duration_hrs": ("created duration", "created hours", "processing hours"),
    "published_duration_hrs": ("published duration", "published hours"),
    "dq_score": ("data quality score", "dq score", "quality score"),
    "avg_processing_lag_min": ("processing lag", "avg processing lag"),
    "avg_publishing_lag_min": ("publishing lag", "avg publishing lag", "turnaround time"),
}

_DIMENSION_ALIASES: dict[str, tuple[str, ...]] = {
    "client": ("client", "clients"),
    "channel": ("channel", "channels"),
    "user": ("user", "users", "team member", "team members"),
    "team": ("team", "teams"),
    "language": ("language", "languages"),
    "input_type": ("input type", "input types"),
    "output_type": ("output type", "output types"),
    "platform": ("platform", "platforms"),
    "billable_flag": ("billable flag", "billable status"),
    "published_flag": ("published flag", "published status"),
}

_DATE_RANGE_ALIASES: dict[str, tuple[str, ...]] = {
    "last_7d": ("last 7 days", "past 7 days"),
    "last_30d": ("last 30 days", "past 30 days"),
    "last_90d": ("last 90 days", "past 90 days"),
    "this_month": ("this month",),
    "last_month": ("last month",),
    "ytd": ("year to date", "ytd"),
}

_TIME_GRAIN_ALIASES: dict[str, tuple[str, ...]] = {
    "day": ("daily", "by day", "per day"),
    "week": ("weekly", "by week", "per week"),
    "month": ("monthly", "by month", "per month"),
    "quarter": ("quarterly", "by quarter", "per quarter"),
    "year": ("yearly", "annually", "by year", "per year"),
}

_CHART_ALIASES: dict[str, tuple[str, ...]] = {
    "bar": ("bar chart", "bar graph", "bars"),
    "line": ("line chart", "line graph"),
    "area": ("area chart",),
    "table": ("table", "tabular"),
    "stat": ("stat", "kpi card", "single value"),
    "pie": ("pie chart", "donut", "donut chart"),
}

_TOP_N_RE = re.compile(r"\btop\s+(?P<limit>\d{1,3})\b")


@dataclass(frozen=True)
class PlannedQuestion:
    interpreted_question: str
    plan: AgentPlan
    planner_source: str = "deterministic"
    planner_model: str | None = None
    planner_confidence: float | None = None
    planner_fallback_reason: str | None = None


class DeterministicPlanner:
    """Registry-aware fallback planner for the agent MVP."""

    def plan(self, question: str, *, supplied_plan: AgentPlan | None = None) -> PlannedQuestion:
        if supplied_plan is not None:
            return PlannedQuestion(
                interpreted_question=question.strip(),
                plan=supplied_plan,
                planner_source="supplied_plan",
            )

        normalized = question.strip().lower()
        metrics = self._match_metrics(normalized)
        dimensions = self._match_dimensions(normalized)
        filters = self._match_filters(normalized)
        time_grain = self._match_time_grain(normalized)
        chart = self._match_chart(normalized)
        limit = self._match_limit(normalized)
        intent = self._infer_intent(normalized, metrics, dimensions, time_grain, limit)

        if not metrics and intent != "explain_metric":
            metrics = ["total_uploaded"]

        if chart is None:
            chart = self._default_chart(intent, dimensions, time_grain, metrics)

        order_by: list[SortRule] = []
        if limit and metrics:
            order_by.append(SortRule(field=metrics[0], direction="desc"))

        return PlannedQuestion(
            interpreted_question=question.strip(),
            plan=AgentPlan(
                intent=intent,
                metrics=metrics,
                dimensions=dimensions,
                filters=filters,
                time_grain=time_grain,
                order_by=order_by,
                limit=limit or 50,
                chart=chart,
            ),
            planner_source="deterministic",
        )

    def _match_metrics(self, question: str) -> list[str]:
        matches: list[str] = []
        for metric_name, aliases in _METRIC_ALIASES.items():
            if any(alias in question for alias in aliases):
                matches.append(metric_name)
        for metric_name, metric_def in METRIC_REGISTRY.items():
            if metric_name in question or metric_def.label.lower() in question:
                if metric_name not in matches:
                    matches.append(metric_name)
        return matches

    def _match_dimensions(self, question: str) -> list[str]:
        matches: list[str] = []
        for dim_name, aliases in _DIMENSION_ALIASES.items():
            if any(alias in question for alias in aliases):
                matches.append(dim_name)
        if "by " in question and not matches:
            for dim_name, dim_def in DIMENSION_REGISTRY.items():
                if dim_def.label.lower() in question:
                    matches.append(dim_name)
        return matches

    def _match_filters(self, question: str) -> dict[str, str]:
        filters: dict[str, str] = {}
        for date_range, aliases in _DATE_RANGE_ALIASES.items():
            if any(alias in question for alias in aliases):
                filters["date_range"] = date_range
                break
        return filters

    def _match_time_grain(self, question: str) -> str:
        for grain, aliases in _TIME_GRAIN_ALIASES.items():
            if any(alias in question for alias in aliases):
                return grain
        if any(token in question for token in ("trend", "over time")):
            return "day"
        return "all"

    def _match_chart(self, question: str) -> ChartRequest | None:
        for chart_type, aliases in _CHART_ALIASES.items():
            if any(alias in question for alias in aliases):
                return ChartRequest(type=chart_type)
        return None

    def _match_limit(self, question: str) -> int | None:
        match = _TOP_N_RE.search(question)
        if match:
            return int(match.group("limit"))
        return None

    def _infer_intent(
        self,
        question: str,
        metrics: list[str],
        dimensions: list[str],
        time_grain: str,
        limit: int | None,
    ) -> str:
        if "explain" in question and metrics:
            return "explain_metric"
        if limit is not None:
            return "top_n"
        if time_grain != "all":
            return "trend"
        if dimensions:
            return "breakdown"
        if "compare" in question or " vs " in question:
            return "comparison"
        if "table" in question or "list" in question:
            return "raw_table"
        if metrics:
            return "single_kpi"
        return "diagnostic"

    def _default_chart(
        self,
        intent: str,
        dimensions: list[str],
        time_grain: str,
        metrics: list[str],
    ) -> ChartRequest | None:
        if intent == "explain_metric":
            return None
        if time_grain != "all" and metrics:
            return ChartRequest(type="line")
        if dimensions and metrics:
            return ChartRequest(type="bar", x=dimensions[0], y=metrics[0])
        if metrics:
            return ChartRequest(type="stat", y=metrics[0])
        return ChartRequest(type="table")
