"""GET /api/v1/forecast/{metric} — linear trend forecast."""
from __future__ import annotations

import math
from typing import List, Literal, Optional

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from scipy.stats import linregress  # type: ignore[import]
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import FilterParams, get_db
from app.registry.filters import build_where_clause
from app.schemas.responses import ApiResponse, ForecastPoint, ForecastResponse
from app.utils.response import build_metadata

router = APIRouter(prefix="/forecast", tags=["Forecast"])

Metric = Literal[
    "total_uploaded",
    "total_published",
    "uploaded_duration_hrs",
    "created_duration_hrs",
]

_MONTH_LABELS = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
    7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


@router.get("/{metric}", response_model=ApiResponse[ForecastResponse])
async def get_forecast(
    metric: Metric,
    horizon: int = Query(default=6, ge=1, le=24),
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ForecastResponse]:
    """
    Returns last 12 months of actuals + horizon-month linear extrapolation.
    Confidence interval = ±1 std-error of the regression residuals.
    """
    # ── Fetch monthly actuals ──────────────────────────────────────────────────
    where, params = build_where_clause(f)
    # Always exclude rows with no upload timestamp
    base_conditions = ["fv.uploaded_at IS NOT NULL"] + where
    where_sql = "WHERE " + " AND ".join(base_conditions)

    sql = text(f"""
        SELECT
            EXTRACT(YEAR  FROM to_timestamp(fv.uploaded_at))::int AS year,
            EXTRACT(MONTH FROM to_timestamp(fv.uploaded_at))::int AS month,
            COUNT(*)                                            AS total_uploaded,
            SUM(CASE WHEN fv.published THEN 1 ELSE 0 END)         AS total_published,
            COALESCE(SUM(fv.uploaded_duration_sec),  0)/3600.0    AS uploaded_duration_hrs,
            COALESCE(SUM(fv.created_duration_sec),   0)/3600.0    AS created_duration_hrs
        FROM fact_video fv
        {where_sql}
        GROUP BY year, month
        ORDER BY year, month
    """)
    result = await db.execute(sql, params)
    raw = result.mappings().all()

    if not raw:
        raise HTTPException(status_code=404, detail="No historical data found.")

    # Take last 12 months
    history = list(raw)[-12:]

    actuals = [float(r[metric]) for r in history]
    xs = list(range(len(actuals)))

    if len(actuals) < 2:
        raise HTTPException(status_code=422, detail="Not enough data for forecasting.")

    # ── Linear regression ──────────────────────────────────────────────────────
    slope, intercept, r_value, _, std_err = linregress(xs, actuals)
    residuals = [actuals[i] - (slope * i + intercept) for i in xs]
    sigma = float(np.std(residuals))

    model_confidence = round(max(0.0, min(1.0, r_value ** 2)), 3)
    mom_growth = round((slope / max(1, abs(actuals[-1]))) * 100, 2) if actuals else 0.0

    # ── Build response ─────────────────────────────────────────────────────────
    points: List[ForecastPoint] = []

    # Historical points
    for i, r in enumerate(history):
        yr  = int(r["year"])
        mo  = int(r["month"])
        points.append(
            ForecastPoint(
                month_label=f"{_MONTH_LABELS[mo]} {str(yr)[2:]}",
                year=yr,
                month=mo,
                actual=round(float(r[metric]), 2),
                is_forecast=False,
            )
        )

    # Forecast points
    last = history[-1]
    yr, mo = int(last["year"]), int(last["month"])
    for h in range(1, horizon + 1):
        mo += 1
        if mo > 12:
            mo = 1
            yr += 1
        x_val = len(actuals) - 1 + h
        predicted = slope * x_val + intercept
        upper = predicted + 1.96 * sigma
        lower = max(0, predicted - 1.96 * sigma)
        points.append(
            ForecastPoint(
                month_label=f"{_MONTH_LABELS[mo]} {str(yr)[2:]}",
                year=yr,
                month=mo,
                forecast=round(max(0, predicted), 2),
                upper=round(upper, 2),
                lower=round(lower, 2),
                is_forecast=True,
            )
        )

    data = ForecastResponse(
        metric=metric,
        horizon_months=horizon,
        monthly_growth_rate=mom_growth,
        model_confidence=model_confidence,
        data=points,
    )
    from app.schemas.responses import ApiResponse
    return ApiResponse(
        data=data,
        meta=build_metadata(
            f,
            metrics=[metric],
            grain="monthly-aggregated",
            caveats=[
                "Forecast uses OLS linear regression on the last 12 months of actuals",
                "Confidence interval = ±1.96 standard errors of regression residuals",
                "Model confidence (R²) below 0.5 indicates low predictive reliability",
                "Forecast does not account for seasonality or structural breaks",
            ],
            unit="count" if "duration" not in metric else "hours",
        ),
    )
