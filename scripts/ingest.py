"""
Frammer Data Ingestion Script
==============================
Loads all 11 CSV files from the "Frammer Data/" folder into Supabase/Postgres.

Usage (from the backend/ directory):
    poetry run python scripts/ingest.py

The script is idempotent: re-running it will upsert dimensions and skip
already-loaded fact rows (matched on video_id).
"""
from __future__ import annotations

import asyncio
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import pandas as pd

# ── Make app importable ────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal, engine, Base
from app.models.dimensions import (
    DimChannel, DimClient, DimInputType, DimLanguage, DimOutputType, DimUser,
)
from app.models.facts import FactVideo, FactVideoOutputType

settings = get_settings()
CSV_DIR = Path(settings.csv_path)

# ── Language ISO code → display name map ──────────────────────────────────────
LANGUAGE_MAP: dict[str, str] = {
    "en":  "English",
    "hi":  "Hindi",
    "mix": "Mixed",
    "es":  "Spanish",
    "ar":  "Arabic",
    "mr":  "Marathi",
    "fr":  "French",
    "de":  "German",
    "pt":  "Portuguese",
    "ta":  "Tamil",
    "te":  "Telugu",
    "kn":  "Kannada",
    "bn":  "Bengali",
    "gu":  "Gujarati",
    "pa":  "Punjabi",
    "ur":  "Urdu",
}

# ── Month → approximate first-day epoch (for videos without uploaded_at) ───────
MONTH_EPOCHS: dict[str, int] = {
    "Mar 2025": int(datetime(2025, 3, 1, tzinfo=timezone.utc).timestamp()),
    "Apr 2025": int(datetime(2025, 4, 1, tzinfo=timezone.utc).timestamp()),
    "May 2025": int(datetime(2025, 5, 1, tzinfo=timezone.utc).timestamp()),
    "Jun 2025": int(datetime(2025, 6, 1, tzinfo=timezone.utc).timestamp()),
    "Jul 2025": int(datetime(2025, 7, 1, tzinfo=timezone.utc).timestamp()),
    "Aug 2025": int(datetime(2025, 8, 1, tzinfo=timezone.utc).timestamp()),
    "Sep 2025": int(datetime(2025, 9, 1, tzinfo=timezone.utc).timestamp()),
    "Oct 2025": int(datetime(2025, 10, 1, tzinfo=timezone.utc).timestamp()),
    "Nov 2025": int(datetime(2025, 11, 1, tzinfo=timezone.utc).timestamp()),
    "Dec 2025": int(datetime(2025, 12, 1, tzinfo=timezone.utc).timestamp()),
    "Jan 2026": int(datetime(2026, 1, 1, tzinfo=timezone.utc).timestamp()),
    "Feb 2026": int(datetime(2026, 2, 1, tzinfo=timezone.utc).timestamp()),
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def parse_hhmmss(value: str) -> int:
    """Convert 'hh:mm:ss' or 'h:mm:ss' string to integer seconds. Returns 0 on error."""
    if not value or pd.isna(value):
        return 0
    try:
        parts = str(value).strip().split(":")
        if len(parts) == 3:
            h, m, s = int(parts[0]), int(parts[1]), int(float(parts[2]))
            return h * 3600 + m * 60 + s
        if len(parts) == 2:
            m, s = int(parts[0]), int(float(parts[1]))
            return m * 60 + s
    except (ValueError, TypeError):
        pass
    return 0


def clean_str(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s else None


async def upsert_dim(
    session: AsyncSession,
    model,
    lookup_col: str,
    lookup_val: str,
    extra: dict | None = None,
) -> int:
    """Get-or-create a dimension row. Returns the id."""
    q = await session.execute(
        select(model).where(getattr(model, lookup_col) == lookup_val)
    )
    obj = q.scalars().first()
    if obj:
        return obj.id
    kwargs = {lookup_col: lookup_val, **(extra or {})}
    obj = model(**kwargs)
    session.add(obj)
    await session.flush()
    return obj.id


# ── Phase 1: Seed dimension tables ────────────────────────────────────────────

async def seed_dimensions(session: AsyncSession) -> None:
    print("Seeding dimension tables...")

    # Default client (CLIENT 1)
    client_id = await upsert_dim(session, DimClient, "slug", "client-1",
                                  extra={"name": "CLIENT 1"})
    print(f"  dim_client: client_id={client_id}")

    # Languages from LANGUAGE_MAP
    for iso, display in LANGUAGE_MAP.items():
        await upsert_dim(session, DimLanguage, "iso_code", iso,
                          extra={"display_name": display})
    print(f"  dim_language: {len(LANGUAGE_MAP)} rows")

    # Input types from the combined by input type CSV
    input_type_csv = CSV_DIR / "combined_data(2025-3-1-2026-2-28) by input type.csv"
    if input_type_csv.exists():
        df = pd.read_csv(input_type_csv)
        for it in df.iloc[:, 0].dropna().unique():
            await upsert_dim(session, DimInputType, "name", str(it).strip().lower())
        print(f"  dim_input_type: {len(df)} rows")

    # Output types
    output_type_csv = CSV_DIR / "combined_data(2025-3-1-2026-2-28) by output type.csv"
    if output_type_csv.exists():
        df = pd.read_csv(output_type_csv)
        for ot in df.iloc[:, 0].dropna().unique():
            await upsert_dim(session, DimOutputType, "name", str(ot).strip())
        print(f"  dim_output_type: {len(df)} rows")

    # Channels from combined by channel and user CSV
    channel_user_csv = CSV_DIR / "combined_data(2025-3-1-2026-2-28) by channel and user.csv"
    if channel_user_csv.exists():
        df = pd.read_csv(channel_user_csv)
        codes = sorted(df.iloc[:, 0].dropna().unique())
        for code in codes:
            await upsert_dim(session, DimChannel, "obfuscated_code", str(code).strip(),
                               extra={"name": str(code).strip(), "client_id": client_id})
        print(f"  dim_channel: {len(codes)} rows ({', '.join(str(c) for c in codes[:5])}...)")

    # Users from combined by user CSV
    user_csv = CSV_DIR / "combined_data(2025-3-1-2026-2-28) by user.csv"
    if user_csv.exists():
        df = pd.read_csv(user_csv)
        users = df.iloc[:, 0].dropna().unique()
        for user in users:
            await upsert_dim(session, DimUser, "name", str(user).strip(),
                               extra={"client_id": client_id})
        print(f"  dim_user: {len(users)} rows")

    await session.commit()
    print("Dimensions seeded.\n")


# ── Phase 2: Load fact_video from video_list_data_obfuscated.csv ──────────────

async def load_fact_video(session: AsyncSession) -> None:
    csv_path = CSV_DIR / "video_list_data_obfuscated.csv"
    if not csv_path.exists():
        print(f"WARNING: {csv_path} not found — skipping fact_video load")
        return

    print(f"Loading fact_video from {csv_path.name}...")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"  Total rows: {len(df)}")

    # Normalise column names
    df.columns = [c.strip() for c in df.columns]
    # Expected columns: Headline, Source, Published, Team Name, Type,
    #                   Uploaded By, Video ID, Published Platform, Published URL

    # Pre-fetch dimension lookup caches
    ch_res  = await session.execute(select(DimChannel.obfuscated_code, DimChannel.id))
    ch_map  = {r[0]: r[1] for r in ch_res.all()}

    usr_res = await session.execute(select(DimUser.name, DimUser.id))
    usr_map = {r[0]: r[1] for r in usr_res.all()}

    it_res  = await session.execute(select(DimInputType.name, DimInputType.id))
    it_map  = {r[0].lower(): r[1] for r in it_res.all()}

    cli_res = await session.execute(select(DimClient.slug, DimClient.id))
    cli_map = {r[0]: r[1] for r in cli_res.all()}
    client_id = cli_map.get("client-1")

    # Default language: English
    lang_res = await session.execute(select(DimLanguage.iso_code, DimLanguage.id))
    lang_map = {r[0]: r[1] for r in lang_res.all()}
    default_lang_id = lang_map.get("en")

    # Check existing video_ids to enable idempotency
    existing = await session.execute(
        select(FactVideo.video_id).where(FactVideo.video_id.isnot(None))
    )
    existing_ids = {r[0] for r in existing.all()}
    print(f"  Already loaded: {len(existing_ids)} rows")

    batch: list[dict] = []
    skipped = 0
    loaded = 0

    for _, row in df.iterrows():
        vid_id = clean_str(row.get("Video ID"))
        if vid_id and str(vid_id) in existing_ids:
            skipped += 1
            continue

        # Resolve channel
        # The video list CSV doesn't have a Channel column — distribute evenly
        # based on the by-channel CSV proportions. For now assign None and
        # update via separate enrichment pass.
        channel_id = None

        user_name  = clean_str(row.get("Uploaded By"))
        user_id    = usr_map.get(user_name) if user_name else None
        if user_id is None and user_name:
            # Auto-create unlisted user
            new_user = DimUser(name=user_name, client_id=client_id)
            session.add(new_user)
            await session.flush()
            usr_map[user_name] = new_user.id
            user_id = new_user.id

        input_type_raw = clean_str(row.get("Type"))
        input_type_id  = it_map.get(input_type_raw.lower()) if input_type_raw else None

        published_str = clean_str(row.get("Published")) or ""
        published     = published_str.strip().lower() in ("yes", "true", "1")

        batch.append({
            "id":                    uuid.uuid4(),
            "video_id":              vid_id,
            "headline":              clean_str(row.get("Headline")),
            "source_url":            clean_str(row.get("Source")),
            "client_id":             client_id,
            "channel_id":            channel_id,
            "user_id":               user_id,
            "language_id":           default_lang_id,
            "input_type_id":         input_type_id,
            "uploaded_at":           None,  # enriched by monthly distribution pass
            "published":             published,
            "published_platform":    clean_str(row.get("Published Platform")),
            "published_url":         clean_str(row.get("Published URL")),
            "uploaded_duration_sec": 0,
            "created_duration_sec":  0,
            "published_duration_sec": 0,
        })
        loaded += 1

        # Flush in batches of 500
        if len(batch) >= 500:
            await session.execute(FactVideo.__table__.insert(), batch)
            await session.flush()
            batch = []
            print(f"    ...{loaded} rows inserted")

    if batch:
        await session.execute(FactVideo.__table__.insert(), batch)
        await session.flush()

    await session.commit()
    print(f"  Done. Inserted: {loaded}, Skipped (already exists): {skipped}\n")


# ── Phase 3: Apply duration data from aggregated CSVs ─────────────────────────

async def enrich_channel_durations(session: AsyncSession) -> None:
    """
    The video_list CSV has no duration data. We load the channel-level
    aggregated CSV and distribute duration proportionally across fact rows.
    This is a simplification — replace with actual per-video durations
    once the full dataset is available.
    """
    csv_path = CSV_DIR / "combined_data(2025-3-1-2026-2-28) by channel and user.csv"
    if not csv_path.exists():
        return

    print("Enriching durations from channel/user CSV...")
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    # Channel lookup
    ch_res = await session.execute(select(DimChannel.obfuscated_code, DimChannel.id))
    ch_map = {r[0]: r[1] for r in ch_res.all()}

    usr_res = await session.execute(select(DimUser.name, DimUser.id))
    usr_map = {r[0]: r[1] for r in usr_res.all()}

    # For each (channel, user) row: update the matching fact_video rows
    for _, r in df.iterrows():
        ch_code  = clean_str(r.iloc[0])
        usr_name = clean_str(r.iloc[1])
        if not ch_code or not usr_name:
            continue

        ch_id  = ch_map.get(ch_code)
        usr_id = usr_map.get(usr_name)

        uploaded_secs  = parse_hhmmss(str(r.iloc[5]) if len(r) > 5 else "")
        created_secs   = parse_hhmmss(str(r.iloc[6]) if len(r) > 6 else "")
        published_secs = parse_hhmmss(str(r.iloc[7]) if len(r) > 7 else "")
        uploaded_count = int(r.iloc[2]) if len(r) > 2 else 1

        if not ch_id or not usr_id or uploaded_count == 0:
            continue

        # Distribute evenly across rows for this user (approximate)
        per_row_uploaded  = uploaded_secs  // uploaded_count
        per_row_created   = created_secs   // uploaded_count
        per_row_published = published_secs // max(1, int(r.iloc[4]) if len(r) > 4 else 1)

        # Update channel_id for matching user rows that lack one
        await session.execute(
            text("""
                UPDATE fact_video
                SET
                    channel_id            = :ch_id,
                    uploaded_duration_sec = :up_s,
                    created_duration_sec  = :cr_s,
                    published_duration_sec= :pub_s
                WHERE user_id = :usr_id
                  AND (channel_id IS NULL OR channel_id = :ch_id)
            """),
            {
                "ch_id": ch_id,
                "usr_id": usr_id,
                "up_s": per_row_uploaded,
                "cr_s": per_row_created,
                "pub_s": per_row_published,
            },
        )

    await session.commit()
    print("  Duration enrichment complete.\n")


async def enrich_monthly_timestamps(session: AsyncSession) -> None:
    """
    Distribute uploaded_at timestamps based on monthly-chart.csv counts.
    Each video is assigned the first-second of its month bucket.
    """
    csv_path = CSV_DIR / "monthly-chart.csv"
    if not csv_path.exists():
        return

    print("Enriching monthly timestamps...")
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    # Sort by chronological order
    month_order = list(MONTH_EPOCHS.keys())

    for _, row in df.iterrows():
        raw_month = clean_str(row.iloc[0])
        if not raw_month:
            continue
        # Normalise " Apr, 2025" → "Apr 2025"
        normalised = re.sub(r",\s*", " ", raw_month.strip()).strip()
        epoch = MONTH_EPOCHS.get(normalised)
        if epoch is None:
            continue

        # Assign epoch to all fact rows currently without uploaded_at
        # that were uploaded in this month (heuristic: first come, first served)
        count = int(row.iloc[1]) if len(row) > 1 else 0
        if count == 0:
            continue

        await session.execute(
            text("""
                UPDATE fact_video
                SET uploaded_at = :epoch
                WHERE id IN (
                    SELECT id FROM fact_video
                    WHERE uploaded_at IS NULL
                    LIMIT :cnt
                )
            """),
            {"epoch": epoch, "cnt": count},
        )

    await session.commit()
    print("  Monthly timestamp enrichment complete.\n")


# ── Phase 4: Load output type bridge table ─────────────────────────────────────

async def load_output_types_bridge(session: AsyncSession) -> None:
    """
    The output type data comes from the aggregated CSV only (not video-level).
    We create one synthetic "aggregate" fact_video row per (output_type, month)
    combo to represent the volume. Real per-video output types would require
    a richer source dataset.
    """
    csv_path = CSV_DIR / "combined_data(2025-3-1-2026-2-28) by output type.csv"
    if not csv_path.exists():
        return

    print("Loading output type data...")
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    ot_res = await session.execute(select(DimOutputType.name, DimOutputType.id))
    ot_map = {r[0]: r[1] for r in ot_res.all()}

    # Get all existing fact_video IDs to distribute output types
    fv_res = await session.execute(select(FactVideo.id).limit(5000))
    fv_ids = [r[0] for r in fv_res.all()]

    if not fv_ids:
        print("  No fact_video rows yet — skipping output type bridge.")
        return

    # Clear existing bridge rows
    await session.execute(delete(FactVideoOutputType))

    inserted = 0
    # Distribute output types proportionally across existing fact rows
    total_created = df.iloc[:, 2].astype(int).sum() if len(df.columns) > 2 else 1
    fv_count = len(fv_ids)

    for _, row in df.iterrows():
        ot_name    = clean_str(row.iloc[0])
        created_n  = int(row.iloc[2]) if len(row) > 2 else 0
        published_n = int(row.iloc[3]) if len(row) > 3 else 0
        ot_id = ot_map.get(ot_name)
        if not ot_id or created_n == 0:
            continue

        # Assign proportional share of videos to this output type
        share = min(fv_count, max(1, int(created_n * fv_count / total_created)))
        for fv_id in fv_ids[:share]:
            session.add(
                FactVideoOutputType(
                    video_id=fv_id,
                    output_type_id=ot_id,
                    created_count=1,
                    published_count=1 if published_n > 0 else 0,
                )
            )
        inserted += share
        await session.flush()

    await session.commit()
    print(f"  Output type bridge: {inserted} rows inserted.\n")


# ── Phase 5: Materialize derived / semantic fields ─────────────────────────────

# SLA threshold: 7 days in seconds — a video whose publishing_lag_sec exceeds
# this is flagged as an SLA breach.
_SLA_THRESHOLD_SEC = 7 * 24 * 3600


async def materialize_semantic_fields(session: AsyncSession) -> None:
    """
    Compute and store all derived semantic fields in one UPDATE pass.

    Fields updated:
      - is_processed        TRUE when created_duration_sec > 0 (materialized Boolean)
      - processing_lag_sec  processed_at - uploaded_at   (if both timestamps present)
      - publishing_lag_sec  published_at - uploaded_at   (if both timestamps present)
      - total_cycle_lag_sec published_at - uploaded_at   (coalesced cycle; falls back to
                            publishing_lag_sec when processed_at is unavailable)
      - sla_breach_flag     TRUE when publishing_lag_sec > _SLA_THRESHOLD_SEC
      - backlog_age_bucket  '< 1 day' / '1-3 days' / '3-7 days' / '> 7 days'

    For the current dataset timestamps (uploaded_at) are synthetic monthly buckets
    and processed_at / published_at are NULL, so lag fields will be NULL.
    When real per-video timestamps become available (re-run ingest or a backfill
    script), these fields will be populated automatically.
    """
    print("Materializing semantic fields (is_processed, lags, SLA, backlog)...")

    # ── is_processed ──────────────────────────────────────────────────────────
    await session.execute(text("""
        UPDATE fact_video
        SET is_processed = (COALESCE(created_duration_sec, 0) > 0)
    """))

    # ── Lag fields (only where both timestamps available) ─────────────────────
    await session.execute(text("""
        UPDATE fact_video
        SET
            processing_lag_sec = CASE
                WHEN processed_at IS NOT NULL AND uploaded_at IS NOT NULL
                THEN processed_at - uploaded_at
                ELSE NULL
            END,
            publishing_lag_sec = CASE
                WHEN published_at IS NOT NULL AND uploaded_at IS NOT NULL
                THEN published_at - uploaded_at
                ELSE NULL
            END,
            total_cycle_lag_sec = CASE
                WHEN published_at IS NOT NULL AND uploaded_at IS NOT NULL
                THEN published_at - uploaded_at
                ELSE NULL
            END
    """))

    # ── SLA breach + backlog bucket (derived from publishing_lag_sec) ─────────
    await session.execute(text(f"""
        UPDATE fact_video
        SET
            sla_breach_flag = CASE
                WHEN publishing_lag_sec IS NULL THEN NULL
                ELSE (publishing_lag_sec > {_SLA_THRESHOLD_SEC})
            END,
            backlog_age_bucket = CASE
                WHEN publishing_lag_sec IS NULL          THEN NULL
                WHEN publishing_lag_sec <= 86400         THEN '< 1 day'
                WHEN publishing_lag_sec <= 3 * 86400     THEN '1-3 days'
                WHEN publishing_lag_sec <= 7 * 86400     THEN '3-7 days'
                ELSE                                          '> 7 days'
            END
    """))

    await session.commit()
    print("  Semantic field materialization complete.\n")


# ── Main ───────────────────────────────────────────────────────────────────────

async def main() -> None:
    print("=" * 60)
    print(" Frammer Data Ingestion")
    print(f" CSV Directory: {CSV_DIR}")
    print("=" * 60)

    if not CSV_DIR.exists():
        print(f"ERROR: CSV directory not found: {CSV_DIR}")
        print("Please set CSV_DATA_PATH in your .env file.")
        sys.exit(1)

    # Ensure all tables exist (idempotent — won't drop existing data)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_dimensions(session)
        await load_fact_video(session)
        await enrich_channel_durations(session)
        await enrich_monthly_timestamps(session)
        await load_output_types_bridge(session)
        await materialize_semantic_fields(session)

    print("=" * 60)
    print(" Ingestion complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
