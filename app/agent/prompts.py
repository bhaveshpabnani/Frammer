"""Prompt builders for the semantic analytics planner."""
from __future__ import annotations

import json
from typing import Any

from app.registry.dimensions import DIMENSION_REGISTRY
from app.registry.metrics import METRIC_REGISTRY


def build_planner_prompt(
    *,
    base_filters: dict[str, Any],
    allowed_client_slugs: tuple[str, ...],
) -> str:
    metric_inventory = [
        {
            "name": metric.name,
            "label": metric.label,
            "valid_dimensions": sorted(metric.valid_dimensions) if metric.valid_dimensions else "all",
            "valid_time_grains": sorted(metric.valid_time_grains),
            "display_unit": metric.display_unit,
            "default_time_column": metric.default_time_column,
            "requires_bridge": metric.requires_bridge,
        }
        for metric in METRIC_REGISTRY.values()
    ]
    dimension_inventory = [
        {
            "name": dim.name,
            "label": dim.label,
            "filter_param": dim.filter_param,
            "supports_bridge": dim.supports_bridge,
            "is_direct": dim.is_direct,
            "is_flag": dim.is_flag,
        }
        for dim in DIMENSION_REGISTRY.values()
    ]

    return (
        "You are the planning layer for a governed analytics agent.\n"
        "Return only a valid structured plan. Never write SQL.\n"
        "Use only the provided metric and dimension names.\n"
        "Preserve the base filters unless the user explicitly overrides them.\n"
        "If the user asks for a comparison, set compare_mode only when a date range exists.\n"
        "Prefer a compact plan with one clear metric when the request is ambiguous.\n"
        "Allowed date_range slugs are exactly: last_7d, last_30d, last_90d, this_month, last_month, ytd.\n"
        "Metrics:\n"
        f"{json.dumps(metric_inventory, ensure_ascii=True)}\n"
        "Dimensions:\n"
        f"{json.dumps(dimension_inventory, ensure_ascii=True)}\n"
        "Base filters:\n"
        f"{json.dumps(base_filters, ensure_ascii=True)}\n"
        "Allowed client scope:\n"
        f"{json.dumps(list(allowed_client_slugs), ensure_ascii=True)}"
    )
