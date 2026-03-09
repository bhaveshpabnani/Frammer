"""Deterministic summary builder for agent query results."""
from __future__ import annotations

from typing import Any

from app.agent.schemas import AgentPlan


class AgentSummarizer:
    def summarize(self, plan: AgentPlan, columns: list[str], rows: list[list[Any]]) -> str:
        if not rows:
            return "No rows matched the resolved scope and filters."

        row_objects = [
            {column: row[index] for index, column in enumerate(columns)}
            for row in rows
        ]
        summary = self._comparison_summary(plan, row_objects)
        if summary:
            return self._append_truncation(summary, plan, rows)

        summary = self._trend_summary(plan, row_objects)
        if summary:
            return self._append_truncation(summary, plan, rows)

        summary = self._breakdown_summary(plan, row_objects)
        if summary:
            return self._append_truncation(summary, plan, rows)

        summary = self._scalar_summary(plan, row_objects)
        if summary:
            return summary

        return self._append_truncation(
            f"Returned {len(rows)} rows across {len(columns)} columns.",
            plan,
            rows,
        )

    def _comparison_summary(self, plan: AgentPlan, rows: list[dict[str, Any]]) -> str | None:
        if not (plan.compare_mode and plan.metrics):
            return None
        metric = plan.metrics[0]
        delta_key = f"delta_{metric}_pct"
        current_key = metric
        comparison_key = f"comparison_{metric}"
        comparable = [
            row for row in rows
            if isinstance(row.get(delta_key), (int, float))
        ]
        if not comparable:
            return None
        leader = max(comparable, key=lambda row: float(row[delta_key]))
        laggard = min(comparable, key=lambda row: float(row[delta_key]))
        label_key = "time" if plan.time_grain != "all" else (plan.dimensions[0] if plan.dimensions else None)
        if label_key:
            return (
                f"Best visible change is {leader.get(label_key)} at {round(float(leader[delta_key]), 1)}% "
                f"for {metric.replace('_', ' ')}, versus {leader.get(comparison_key)} in the comparison window. "
                f"Weakest visible change is {laggard.get(label_key)} at {round(float(laggard[delta_key]), 1)}%."
            )
        return (
            f"{metric.replace('_', ' ')} is {leader.get(current_key)} versus {leader.get(comparison_key)} "
            f"in the comparison window, a change of {round(float(leader[delta_key]), 1)}%."
        )

    def _trend_summary(self, plan: AgentPlan, rows: list[dict[str, Any]]) -> str | None:
        if not (plan.time_grain != "all" and plan.metrics):
            return None
        metric = plan.metrics[0]
        numeric_rows = [row for row in rows if isinstance(row.get(metric), (int, float))]
        if not numeric_rows:
            return None
        peak = max(numeric_rows, key=lambda row: float(row[metric]))
        trough = min(numeric_rows, key=lambda row: float(row[metric]))
        return (
            f"{metric.replace('_', ' ')} peaked at {peak.get(metric)} on {peak.get('time')} "
            f"and bottomed at {trough.get(metric)} on {trough.get('time')} "
            f"across {len(numeric_rows)} visible time buckets."
        )

    def _breakdown_summary(self, plan: AgentPlan, rows: list[dict[str, Any]]) -> str | None:
        if not (plan.dimensions and plan.metrics):
            return None
        primary_metric = plan.metrics[0]
        label_key = plan.dimensions[0]
        numeric_rows = [row for row in rows if isinstance(row.get(primary_metric), (int, float))]
        if not numeric_rows:
            return None
        leader = max(numeric_rows, key=lambda row: float(row[primary_metric]))
        summary = (
            f"Top visible {label_key.replace('_', ' ')} is {leader.get(label_key)} "
            f"at {leader.get(primary_metric)} for {primary_metric.replace('_', ' ')}."
        )
        if len(plan.metrics) > 1:
            secondary_metric = plan.metrics[1]
            if isinstance(leader.get(secondary_metric), (int, float)):
                summary += f" The same row reports {leader.get(secondary_metric)} for {secondary_metric.replace('_', ' ')}."
        return summary

    def _scalar_summary(self, plan: AgentPlan, rows: list[dict[str, Any]]) -> str | None:
        if not plan.metrics:
            return None
        metric = plan.metrics[0]
        value = rows[0].get(metric)
        if value is None and len(rows[0]) == 1:
            value = next(iter(rows[0].values()))
        if value is None:
            return None
        return f"{metric.replace('_', ' ')} is {value} for the resolved scope."

    def _append_truncation(self, summary: str, plan: AgentPlan, rows: list[list[Any]]) -> str:
        if len(rows) >= plan.limit and plan.intent in {"top_n", "breakdown", "comparison", "raw_table"}:
            return summary + " Results shown are limited to the visible capped row set."
        return summary
