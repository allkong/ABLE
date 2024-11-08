import src.checkpoints.service as service

from fastapi import APIRouter, status

from src.checkpoints.schemas import CheckpointListResponse
from src.response.schemas import ResponseModel
from src.response.utils import created, ok, no_content

checkpoint_router = router = APIRouter()

@router.post("/{project_name}/{result_name}", response_model=ResponseModel,
             summary="checkpoints 목록 조회", description="")
async def create_project(project_name: str, result_name: str):
    service.get_checkpoints(project_name, result_name)
    return ok(
        data=CheckpointListResponse(
            checkpoints=service.get_checkpoints(project_name, result_name)
        )
    )