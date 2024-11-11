import src.deploy.service as service
from fastapi import APIRouter
from starlette.responses import Response
from src.response.utils import accepted, ok, no_content, bad_request
from .schemas import RegisterApiRequest

deploy_router = router = APIRouter()

@router.get("/run")
def run() -> Response:
    service.run()
    return accepted()

@router.get("/stop")
def stop() -> Response:
    service.stop()
    return accepted()

@router.post("/routers")
def register_router(request: RegisterApiRequest) -> Response:
    service.register_router(request)
    return accepted()

@router.delete("/routers")
def remove_router(uri: str) -> Response:
    service.remove_router(uri)
    return accepted()

@router.post("/restart")
def restart() -> Response:
    service.stop()
    service.run()
    return accepted()

@router.get("/api",
            summary="배포된 API 리스트 조회", description="")
def get_api_list(page: int, page_size: int):
    api_list = service.get_api_list(page, page_size)
    if api_list is None:
        return bad_request()
    if len(api_list) == 0:
        return no_content()
    return ok(data=api_list)