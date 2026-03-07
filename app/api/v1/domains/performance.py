"""Performance domain: clients, channels, users, teams, and analytics scores."""
from fastapi import APIRouter

from app.api.v1 import analytics, channels, clients, teams, users

router = APIRouter()

router.include_router(clients.router)
router.include_router(channels.router)
router.include_router(users.router)
router.include_router(teams.router)
router.include_router(analytics.router)
