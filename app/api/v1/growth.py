"""GET /api/v1/growth — period-over-period growth KPIs."""
from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import FilterParams, get_db
from app.registry.filters import build_dim_only_where_clause
from app.schemas.responses import (
    ApiResponse,
    GrowthDriverRow,
    GrowthDriversResponse,
    GrowthPeriod,
    GrowthResponse,
)
from app.utils.response import wrap

router = APIRouter(prefix="/growth", tags=["Growth"])

_MONTH_LABELS = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
    7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


def _month_epochs(yr: int, mo: int) -> tuple[int, int]:
    first = int(datetime(yr, mo, 1, tzinfo=timezone.utc).timestamp())
    last_day = monthrange(yr, mo)[1]
    last = int(datetime(yr, mo, last_day, 23, 59, 59, tzinfo=timezone.utc).timestamp())
    return first, last


def _prev_month(yr: int, mo: int) -> tuple[int, int]:
    if mo == 1:
        return yr - 1, 12
    return yr, mo - 1


async def _query_month(
    db: AsyncSession,
    yr: int,
    mo: int,
    dim_where: list[str],
    dim_params: dict,
) -> GrowthPeriod:
    ep_from, ep_to = _month_epochs(yr, mo)
    where = dim_where + [
        "fv.uploaded_at >= :ep_from",
        "fv.uploaded_at <= :ep_to",
    ]
    params = {**dim_params, "ep_from": ep_from, "ep_to": ep_to}
    where_sql = "WHERE " + " AND ".join(where)

    sql = text(f"""
        SELECT
            COUNT(*)                                                         AS uploaded,
            SUM(CASE WHEN is_processed THEN 1 ELSE 0 END)                   AS processed,
            SUM(CASE WHEN published THEN 1 ELSE 0 END)                      AS published,
            COALESCE(SUM(uploaded_duration_sec),  0) / 3600.0               AS uploaded_hrs,
            COALESCE(SUM(published_duration_sec), 0) / 3600.0               AS published_hrs
        FROM fact_video fv
        {where_sql}
    """)
    row = (await db.execute(sql, params)).mappings().one()
    uploaded = int(row["uploaded"] or 0)
    return GrowthPeriod(
        period_label=f"{_MONTH_LABELS[mo]} {str(yr)[2:]}",
        year=yr,
        month=mo,
        uploaded=uploaded,
        processed=int(row["processed"] or 0),
        published=int(row["published"] or 0),
        uploaded_duration_hrs=round(float(row["uploaded_hrs"] or 0), 2),
        published_duration_hrs=round(float(row["published_hrs"] or 0), 2),
    )


@router.get("", response_model=ApiResponse[GrowthResponse])
async def get_growth(
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[GrowthResponse]:
    """
    Returns current month vs previous month comparison plus
    rolling 30-day counts. Uses latest month with data if no date filter.
    """
    dim_where, dim_params = build_dim_only_where_clause(f)

    # Determine reference year/month
    if f.date_to:
        ref_yr, ref_mo = f.date_to.year, f.date_to.month
    else:
        # Use latest month in the DB
        latest_sql = text("""
            SELECT
                EXTRACT(YEAR  FROM to_timestamp(uploaded_at))::int AS yr,
                EXTRACT(MONTH FROM to_timestamp(uploaded_at))::int AS mo
            FROM fact_video
            WHERE uploaded_at IS NOT NULL
            ORDER BY uploaded_at DESC
            LIMIT 1
        """)
        latest = (await db.execute(latest_sql)).mappings().first()
        if latest:
            ref_yr, ref_mo = int(latest["yr"]), int(latest["mo"])
        else:
            today = date.today()
            ref_yr, ref_mo = today.year, today.month

    prev_yr, prev_mo = _prev_month(ref_yr, ref_mo)

    # Respect compare_mode: previous_year compares same month of last year.
    # previous_month (default) and previous_period both use the previous calendar month
    # because growth endpoint works on monthly buckets.
    effective_compare = getattr(f, "compare_mode", None)
    if effective_compare == "previous_year":
        prev_yr, prev_mo = ref_yr - 1, ref_mo

    current  = await _query_month(db, ref_yr,  ref_mo,  dim_where, dim_params)
    previous = await _query_month(db, prev_yr, prev_mo, dim_where, dim_params)

    def _pct(curr: int, prev: int) -> Optional[float]:
        return round((curr - prev) / prev * 100, 1) if prev else None

    # Rolling 30-day counts (no month boundary)
    rolling_sql = text("""
        SELECT
            COUNT(*) FILTER (WHERE uploaded_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::int)  AS r30_uploaded,
            SUM(CASE WHEN published AND uploaded_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::int THEN 1 ELSE 0 END) AS r30_published
        FROM fact_video
    """)
    rolling_row = (await db.execute(rolling_sql)).mappings().one()

    data = GrowthResponse(
        current=current,
        previous=previous,
        compare_mode=effective_compare or "previous_month",
        mom_uploaded_pct=_pct(current.uploaded,  previous.uploaded),
        mom_published_pct=_pct(current.published, previous.published),
        mom_duration_pct=_pct(
            int(current.uploaded_duration_hrs * 100),
            int(previous.uploaded_duration_hrs * 100),
        ),
        rolling_30d_uploaded=int(rolling_row["r30_uploaded"] or 0),
        rolling_30d_published=int(rolling_row["r30_published"] or 0),
    )
    return wrap(data, f,
                metrics=["total_uploaded", "total_published", "mom_growth_pct"],
                grain="monthly-aggregated",
                caveats=["MoM delta is null when the previous period has zero records",
                         "Rolling 30-day counts ignore active dimension filters"],
                unit="count")


# ── /growth/drivers ────────────────────────────────────────────────────────────

@router.get("/drivers", response_model=ApiResponse[GrowthDriversResponse])
async def growth_drivers(
    dimension: str = Query(
        default="channel",
        description="channel | client | output_type | user | language | input_type",
    ),
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[GrowthDriversResponse]:
    """
    Contribution-to-change analysis: which segments drove MoM growth.
    Returns each segment's current value, previous value, delta, and
    its share of the total absolute delta.
    """
    dim_where, dim_params = build_dim_only_where_clause(f)

    # Determine reference month
    if f.date_to:
        ref_yr, ref_mo = f.date_to.year, f.date_to.month
    else:
        latest = (await db.execute(text("""
            SELECT EXTRACT(YEAR  FROM to_timestamp(uploaded_at))::int AS yr,
                   EXTRACT(MONTH FROM to_timestamp(uploaded_at))::int AS mo
            FROM fact_video WHERE uploaded_at IS NOT NULL ORDER BY uploaded_at DESC LIMIT 1
        """))).mappings().first()
        if latest:
            ref_yr, ref_mo = int(latest["yr"]), int(latest["mo"])
        else:
            today = date.today()
            ref_yr, ref_mo = today.year, today.month

    prev_yr, prev_mo = _prev_month(ref_yr, ref_mo)
    # growth_drivers also respects compare_mode for year-over-year comparison
    if getattr(f, "compare_mode", None) == "previous_year":
        prev_yr, prev_mo = ref_yr - 1, ref_mo
    cur_from, cur_to = _month_epochs(ref_yr, ref_mo)
    prv_from, prv_to = _month_epochs(prev_yr, prev_mo)

    # Dimension join + group column map
    DIM_MAP = {
        "client":      ("JOIN dim_client dcl ON dcl.id = fv.client_id",    "dcl.name"),
        "channel":     ("JOIN dim_channel dc ON dc.id = fv.channel_id",    "dc.name"),
        "user":        ("JOIN dim_user du ON du.id = fv.user_id",           "du.name"),
        "output_type": (
            "LEFT JOIN fact_video_output_type fvot ON fvot.video_id = fv.id "
            "JOIN dim_output_type dot ON dot.id = fvot.output_type_id",
            "dot.name",
        ),
        "language":    ("JOIN dim_language dl ON dl.id = fv.language_id",  "dl.display_name"),
        "input_type":  ("JOIN dim_input_type dit ON dit.id = fv.input_type_id", "dit.name"),
    }
    if dimension not in DIM_MAP:
        dimension = "channel"
    dim_join, dim_col = DIM_MAP[dimension]

    def _period_sql(ep_from: int, ep_to: int) -> tuple[str, dict]:
        key_from = f"_ep_from_{ep_from}"
        key_to   = f"_ep_to_{ep_to}"
        w = dim_where + [f"fv.uploaded_at >= :{key_from}", f"fv.uploaded_at <= :{key_to}"]
        return (
            f"SELECT {dim_col} AS seg, COUNT(fv.id) AS cnt "
            f"FROM fact_video fv {dim_join} "
            f"WHERE {' AND '.join(w)} "
            f"GROUP BY {dim_col}",
            {**dim_params, key_from: ep_from, key_to: ep_to},
        )

    cur_qsql, cur_p = _period_sql(cur_from, cur_to)
    prv_qsql, prv_p = _period_sql(prv_from, prv_to)

    cur_rows = {r["seg"]: int(r["cnt"] or 0) for r in (await db.execute(text(cur_qsql), cur_p)).mappings().all()}
    prv_rows = {r["seg"]: int(r["cnt"] or 0) for r in (await db.execute(text(prv_qsql), prv_p)).mappings().all()}

    all_segs = set(cur_rows) | set(prv_rows)
    drivers_raw: List[tuple[str, int, int, int]] = []
    for seg in all_segs:
        cur_v = cur_rows.get(seg, 0)
        prv_v = prv_rows.get(seg, 0)
        drivers_raw.append((seg, cur_v, prv_v, cur_v - prv_v))

    # Sort by absolute delta descending
    drivers_raw.sort(key=lambda x: abs(x[3]), reverse=True)

    total_abs_delta = sum(abs(d[3]) for d in drivers_raw) or 1

    cur_label  = f"{_MONTH_LABELS[ref_mo]} {str(ref_yr)[2:]}"
    prev_label = f"{_MONTH_LABELS[prev_mo]} {str(prev_yr)[2:]}"
    total_delta = sum(d[3] for d in drivers_raw)

    drivers: List[GrowthDriverRow] = [
        GrowthDriverRow(
            segment=seg,
            current_value=cur_v,
            prev_value=prv_v,
            delta=delta,
            share_of_total_delta=round(abs(delta) / total_abs_delta, 4),
        )
        for seg, cur_v, prv_v, delta in drivers_raw
    ]

    data = GrowthDriversResponse(
        dimension=dimension,
        period_current=cur_label,
        period_prev=prev_label,
        total_delta=total_delta,
        drivers=drivers,
    )
    return wrap(data, f,
                metrics=["total_uploaded"],
                grain="monthly-aggregated",
                caveats=["Driver analysis computes MoM contribution based on uploaded count only"],
                unit="count")
