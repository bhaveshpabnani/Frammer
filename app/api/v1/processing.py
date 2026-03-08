"""GET /api/v1/processing/duration-buckets — video duration distribution."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import FilterParams, get_db
from app.registry.filters import build_where_clause
from app.schemas.responses import ApiResponse, DurationBucketRow
from app.utils.response import wrap

router = APIRouter(prefix="/processing", tags=["Processing"])


@router.get("/duration-buckets", response_model=ApiResponse[List[DurationBucketRow]])
async def get_duration_buckets(
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[List[DurationBucketRow]]:
    """Return video count grouped by uploaded duration buckets."""
    where, params = build_where_clause(f)
    fv_where = ("WHERE " + " AND ".join(where)) if where else ""

    sql = text(f"""
        SELECT range, COUNT(*) AS count
        FROM (
            SELECT
                CASE
                    WHEN fv.uploaded_duration_sec IS NULL OR fv.uploaded_duration_sec = 0 THEN 'Unknown'
                    WHEN fv.uploaded_duration_sec < 1800                               THEN '< 30 min'
                    WHEN fv.uploaded_duration_sec < 3600                               THEN '30-60 min'
                    WHEN fv.uploaded_duration_sec < 7200                               THEN '1-2 hrs'
                    WHEN fv.uploaded_duration_sec < 14400                              THEN '2-4 hrs'
                    WHEN fv.uploaded_duration_sec < 28800                              THEN '4-8 hrs'
                    ELSE '> 8 hrs'
                END AS range
            FROM fact_video fv
            {fv_where}
        ) sub
        GROUP BY range
        ORDER BY
            CASE range
                WHEN '< 30 min'  THEN 1
                WHEN '30-60 min' THEN 2
                WHEN '1-2 hrs'   THEN 3
                WHEN '2-4 hrs'   THEN 4
                WHEN '4-8 hrs'   THEN 5
                WHEN '> 8 hrs'   THEN 6
                ELSE 7
            END
    """)

    result = await db.execute(sql, params)
    rows = result.mappings().all()

    data = [
        DurationBucketRow(range=r["range"], count=int(r["count"] or 0))
        for r in rows
    ]
    return wrap(data, f,
                metrics=["total_uploaded"],
                grain="video-level",
                caveats=["Duration buckets are computed from uploaded_duration_sec"],
                unit="count")
