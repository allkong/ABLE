from typing import Optional
from src.response.schemas import ImmutableBaseModel

class CheckpointListResponse(ImmutableBaseModel):
    checkpoints: list[str]