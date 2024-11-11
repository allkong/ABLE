from fastapi import APIRouter, UploadFile, File, Query

from src.response.schemas import ResponseModel
from src.analysis.schemas import CheckpointResponse, AnalyzeResponse, FeatureMapRequest, FeatureMapResponse, HeatMapResponse
import src.analysis.service as service
from src.canvas.schemas import GetCanvasResponse
from src.response.utils import *

analysis_router = router = APIRouter()

@router.get("", response_model=ResponseModel[CheckpointResponse],
            summary="epoch 목록 조회", description="무한 스크롤")
async def get_checkpoints(project_name: str, result_name: str,
                    index: int = Query(..., description="몇 번째 스크롤인지"),
                    size: int = Query(..., description="스크롤 한 번에 가져올 아이템 개수")):
    response = service.get_checkpoints(project_name, result_name, index, size)
    if response.epochs is None:
        return bad_request()
    if len(response.epochs) == 0:
        return no_content()
    return ok(data=response)

@router.post("/feature-map", response_model=ResponseModel[FeatureMapResponse],
            summary="피쳐 맵 조회", description="블록의 피쳐맵 조회, 피쳐맵이 존재하지 않는 블록일 경우 null 반환")
async def get_feature_map( request: FeatureMapRequest):
    feature_map = service.get_feature_map(request)
    if feature_map is None:
        return no_content()
    return ok(data=FeatureMapResponse(feature_map=feature_map))

@router.post("", 
             response_model=ResponseModel[AnalyzeResponse],
             summary="분석 실행 및 히트맵 생성", description="특정 학습 결과의 에포크에 대해 샘플 이미지 1장을 받아 실행 후 히트맵과 상위 3개의 클래스 점수(막대그래프 데이터) 반환" )
async def analyze(project_name: str, result_name: str, epoch_name:str, device_index: int, file: UploadFile = File(...)):
    if(file.content_type != "image/jpeg"):
        return bad_request()
    result = await service.analyze(project_name, result_name, epoch_name, device_index, file)
    return ok(data=result)

@router.get("/model",
             summary="특정 학습 결과의 모델(캔버스) 불러오기", description="분석 페이지 접근 시 보여지는 블록 그래프")
async def get_model(project_name:str, result_name:str):
    canvas = service.get_block_graph(project_name, result_name)
    return ok(data=GetCanvasResponse(canvas=canvas))

@router.get("/heatmap",
            response_model=ResponseModel[HeatMapResponse],
            summary="원본 이미지, 히트맵과 상위 3개의 클래스 반환",
            description="이전 분석 결과가 있는 경우 원본 이미지.jpg, 히트맵.jgp, 상위 3개 클래스 이름과 점수를 반환. 이전 분석 결과가 없는 경우 204 반환")
async def get_heatmap(project_name: str, result_name:str, epoch_name:str):
    heatmap = service.get_heatmap(project_name, result_name, epoch_name)
    if heatmap is None:
        return no_content()
    return ok(data=heatmap)