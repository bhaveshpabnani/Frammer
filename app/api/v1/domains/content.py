"""Content domain: input types, output types, languages."""
from fastapi import APIRouter

from app.api.v1 import input_types, languages, output_types

router = APIRouter()

router.include_router(input_types.router)
router.include_router(output_types.router)
router.include_router(languages.router)
