"""GET /api/v1/users — user / team productivity."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import FilterParams, get_db
from app.registry.filters import build_where_clause
from app.schemas.responses import ApiResponse, UserRow
from app.utils.response import wrap

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=ApiResponse[List[UserRow]])
async def get_users(
    f: FilterParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[List[UserRow]]:
    where, params = build_where_clause(f)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    sql = text(f"""
        SELECT
            du.name                                               AS "user",
            du.team_name                                          AS team_name,
            COUNT(fv.id)                                          AS total_uploaded,
            SUM(CASE WHEN fv.is_processed THEN 1 ELSE 0 END)     AS total_created,
            SUM(CASE WHEN fv.published THEN 1 ELSE 0 END)        AS total_published,
            COALESCE(SUM(fv.uploaded_duration_sec),  0)/3600.0   AS uploaded_duration_hrs,
            COALESCE(SUM(fv.created_duration_sec),   0)/3600.0   AS created_duration_hrs,
            COALESCE(SUM(fv.published_duration_sec), 0)/3600.0   AS published_duration_hrs,
            CASE WHEN COUNT(fv.id) > 0
                 THEN COALESCE(SUM(fv.uploaded_duration_sec), 0) / COUNT(fv.id) / 60.0
                 ELSE 0 END                                       AS avg_duration_min
        FROM fact_video fv
        JOIN dim_user du ON du.id = fv.user_id
        {where_sql}
        GROUP BY du.name, du.team_name
        ORDER BY total_uploaded DESC
    """)

    result = await db.execute(sql, params)
    rows = result.mappings().all()

    data = [
        UserRow(
            user=r["user"],
            team_name=r["team_name"],
            total_uploaded=int(r["total_uploaded"] or 0),
            total_created=int(r["total_created"] or 0),
            total_published=int(r["total_published"] or 0),
            uploaded_duration_hrs=round(float(r["uploaded_duration_hrs"] or 0), 2),
            created_duration_hrs=round(float(r["created_duration_hrs"] or 0), 2),
            published_duration_hrs=round(float(r["published_duration_hrs"] or 0), 2),
            avg_duration_min=round(float(r["avg_duration_min"] or 0), 1),
        )
        for r in rows
    ]
    return wrap(data, f, metrics=["total_uploaded", "total_published", "uploaded_duration_hrs"],
                grain="segment-aggregated", unit="count")
