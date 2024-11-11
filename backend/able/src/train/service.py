import json
from . import TrainRequest
from src.train.schemas import TrainResultResponse, EpochResult, Loss, Accuracy
from .utils import *
from src.file.path_manager import PathManager
from src.file.utils import validate_file_format, get_file, create_directory
from src.utils import encode_image_to_base64
from src.file.utils import read_image_file
from typing import List

import logging

from src.train_log.utils import format_float
from ..device.schema import DeviceStatus
from ..device.utils import get_device_status, update_device_status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

path_manager = PathManager()

async def train_in_background(request: TrainRequest):
    train(request)

def train(request: TrainRequest):

    data_block, transform_blocks, loss_blocks, optimizer_blocks, other_blocks = split_blocks(request.canvas.blocks)

    if isinstance(data_block, CanvasBlock):
        data_block: CanvasBlock = data_block

    if data_block is None:
        raise ValueError("Data block is required but was not found.")

    data_path = find_data_path(data_block)

    # if not validate_file_format(data_path, "json"):
    #     raise Exception()

    transform_blocks_conn, loss_blocks_conn, optimizer_blocks_conn, other_blocks_conn = filter_blocks_connected_to_data(
        data_block, transform_blocks, loss_blocks, optimizer_blocks, other_blocks, request.canvas.edges
    )

    # 학습에서 사용하는 간선 추출
    blocks_connected_to_data: list[Block] = [data_block, *transform_blocks_conn, *loss_blocks_conn, *optimizer_blocks_conn, *other_blocks_conn]
    canvas_blocks = convert_canvas_blocks(blocks_connected_to_data)
    edges = filter_edges_from_block_connected_data(canvas_blocks, request.canvas.edges)

    edges_model = filter_model_edge(other_blocks_conn, edges)

    transforms = create_data_preprocessor(transform_blocks)

    dataset = create_dataset(data_path, transforms)
    model = convert_block_graph_to_model([block for block in other_blocks_conn if isinstance(block, CanvasBlock)], edges_model)

    if model is None:
        raise Exception()

    criterion = convert_criterion_block_to_module(loss_blocks[0])
    optimizer = convert_optimizer_block_to_optimizer(optimizer_blocks[0], model.parameters())

    # TrainLogger 초기화 전 디렉터리 생성
    project_name = request.project_name
    result_name = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 결과 및 에포크 디렉터리 생성
    result_path = path_manager.get_train_results_path(project_name) / result_name
    epochs_path = path_manager.get_checkpoints_path(project_name, result_name)
    create_directory(result_path)
    create_directory(epochs_path)

    # 데이터셋 메타데이터 저장
    save_metadata(project_name, result_name, data_block, dataset.classes)

    # 학습 모델 그래프 저장
    save_result_block_graph(request.project_name, result_name, canvas_blocks, edges_model)

    # 하이퍼 파라미터 정보 저장 (hyper_parameters.json)
    save_result_hyper_parameter(request.project_name, result_name, request.batch_size, request.epoch)

    device = 'cpu'
    if request.device.index != -1:
        device = f"cuda:{request.device.index}"

    if get_device_status(request.device.name) == DeviceStatus.IN_USE:
        raise Exception()

    update_device_status(request.device.name, DeviceStatus.IN_USE)

    train_logger = TrainLogger(project_name, result_name)

    try:
        trainer = Trainer(model, dataset, criterion, optimizer, request.batch_size, TrainLogger(request.project_name, result_name), device=device)

        logger.info("학습 시작")
        trainer.train(request.epoch)
        logger.info("학습 종료")

        logger.info("테스트 시작")
        trainer.test()
        logger.info("테스트 종료")
        train_logger.update_status(TrainStatus.COMPLETE)
    except Exception as e:
        train_logger.update_status(TrainStatus.FAIL)
        raise e
    finally:
        update_device_status(request.device.name, DeviceStatus.NOT_IN_USE)

def load_train_result(project_name: str, result_name: str) -> TrainResultResponse:

    # 결과 디렉터리 경로 설정
    result_path = path_manager.get_train_result_path(project_name, result_name)

    # 혼동 행렬 이미지 로드 및 인코딩
    image_bytes = read_image_file(result_path / "confusion_matrix.jpg")  # 파일 경로에서 bytes 읽기
    confusion_matrix = encode_image_to_base64(image_bytes)

    # 성능 지표 로드
    performance_metrics_data = json.loads(get_file(result_path / "performance_metrics.json"))
    performance_metrics = PerformanceMetrics.model_validate(performance_metrics_data["metrics"])

    # F1 스코어 로드
    f1_score = format_float(str_to_json(get_file(result_path / "f1_score.json"))["f1_score"])

    # 에포크 결과 로드
    epochs_path = path_manager.get_checkpoints_path(project_name, result_name)
    epoch_results: List[EpochResult] = []

    for epoch_dir in epochs_path.iterdir():
        if epoch_dir.is_dir():
            epoch_id = epoch_dir.name

            training_loss_data = str_to_json(get_file(epoch_dir / "training_loss.json"))
            validation_loss_data = str_to_json(get_file(epoch_dir / "validation_loss.json"))
            accuracy_data = str_to_json(get_file(epoch_dir / "accuracy.json"))

            # 각 파일을 로드하여 모델 인스턴스로 변환
            training_loss = Loss(training=training_loss_data["loss"], validation=validation_loss_data["loss"])
            # validation_loss = Loss.model_validate(validation_loss_data)
            accuracy = Accuracy(accuracy=accuracy_data["accuracy"])

            # 에포크 결과 인스턴스 생성
            epoch_result = EpochResult(
                epoch=epoch_id,
                losses=training_loss,
                accuracies=accuracy
            )
            epoch_results.append(epoch_result)

    # TrainResultResponse 반환
    return TrainResultResponse(
        confusion_matrix=confusion_matrix,
        performance_metrics=performance_metrics,
        f1_score=str(f1_score),
        epoch_result=epoch_results
    )