import os
import subprocess
import sys
import json
import logging
from typing import Optional
from pathlib import Path
from src.deploy.enums import DeployStatus
from src.deploy.exceptions import AlreadyExistApiException, AlreadyRunException, AlreadyStopException
from src.deploy.schemas import RegisterApiRequest, ApiInformation
from src.file.utils import get_file, create_file, remove_file, get_files
from src.file.path_manager import PathManager
from src.utils import str_to_json, json_to_str, handle_pagination

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
path_manager = PathManager()

DEFAULT_METADATA = """{
    "api_version": "0.33.1",
    "port": "8088",
    "pid": null,
    "status": "stop"
}"""


def run() -> bool:
    metadata_path = path_manager.deploy_path / "metadata.json"
    if not metadata_path.exists():
        create_file(metadata_path, DEFAULT_METADATA)

    metadata = str_to_json(get_file(metadata_path))

    if metadata["status"] == DeployStatus.RUNNING.value:
        raise AlreadyRunException()

    process = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "deploy_server.src.main:app",
        "--host", "127.0.0.1", "--port", "8088"
    ])

    metadata.update({"pid": process.pid, "status": DeployStatus.RUNNING.value})
    create_file(metadata_path, json_to_str(metadata))

    return True


def stop() -> bool:
    metadata_path = path_manager.deploy_path / "metadata.json"
    metadata = str_to_json(get_file(metadata_path))

    if metadata["status"] == DeployStatus.STOP.value:
        raise AlreadyStopException()

    pid = metadata.get("pid")
    if pid:
        try:
            if os.name == 'nt':
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], check=True)
            else:
                subprocess.run(["kill", "-9", str(pid)], check=True)
        except subprocess.CalledProcessError:
            raise RuntimeError(f"Failed to stop server with PID {pid}.")

    metadata.update({"status": DeployStatus.STOP.value, "pid": None})
    create_file(metadata_path, json_to_str(metadata))

    return True


BASE_DIR = Path(__file__).resolve().parent.parent.parent / "deploy_server/src"
ROUTER_DIR = BASE_DIR / "routers"
MAIN_FILE_PATH = BASE_DIR / "main.py"

def register_router(request: RegisterApiRequest) -> bool:
    
    path_name = request.uri.strip("/").replace("/", "_")
    file_path = Path(f"{ROUTER_DIR}/{path_name}.py")
    
    # TODO: path_name 중복 확인
    if file_path.exists():
        raise AlreadyExistApiException()
    
    # TODO: path_name.json 파일 만들어야 함 <- api 정보
    deploy_path = path_manager.get_deploy_path() / f"{ path_name }.json"
    if not create_file(deploy_path, json_to_str(request)):
        raise Exception()
    

    content = f'''
import torch
import json
import base64
import io
import numpy as np

from PIL import Image
from fastapi import APIRouter, Body
from src.analysis.utils import read_blocks
from src.deploy.schemas import InferenceResponse
from src.file.path_manager import PathManager
from src.file.utils import get_file
from src.response.utils import ok
from src.train.schemas import TrainResultMetadata
from src.train.utils import create_data_preprocessor, split_blocks
from src.utils import str_to_json

router = APIRouter()
path_manager = PathManager()

@router.post("{request.uri}")
async def path_name_route(image: str = Body(...)):
    
    project_name = "{request.project_name}"
    train_result = "{request.train_result}"
    checkpoint = "{request.checkpoint}"
    
    train_result_metadata_path = path_manager.get_train_result_path(project_name, train_result) / "metadata.json"
    metadata = TrainResultMetadata(**str_to_json(get_file(train_result_metadata_path)))

    #block_graph.json 파일에서 블록 읽어오기
    block_graph_path = path_manager.get_train_result_path(project_name, train_result) / "block_graph.json"
    block_graph = read_blocks(block_graph_path)

    # base64를 이미지로 변환 
    image = base64.b64decode(image)
    image = Image.open(io.BytesIO(image))
    image = np.array(image)
    
    # 블록 카테고리 별로 나누기
    _, transform_blocks, _, _, _ = split_blocks(block_graph.blocks)
    transforms = create_data_preprocessor(transform_blocks)
   
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    
    image: torch.Tensor = transforms(image)
    image = image.unsqueeze(0).to(device=device)

    model = torch.load(path_manager.get_checkpoint_path(project_name, train_result, checkpoint) / "model.pth")

    model.to(device)

    model.eval()
    predicted = model(image)

    top_values, top_indices = predicted.topk(1, dim=1)
    top_values = top_values[0].cpu().detach().numpy()
    top_indices = top_indices[0].cpu().detach().numpy()
        
    predicted_label = metadata.classes[top_indices[0]]
    max_value = top_values[0]
    
    return ok(
        data=InferenceResponse(
            label = predicted_label,
            probability = max_value
        )
    )
'''

    if not create_file(file_path, content):
        return False, f"Failed to create router file for path '{request.uri}'"

    include_statement = f'from deploy_server.src.routers.{path_name} import router as {path_name}_router\n'
    include_statement += f'app.include_router({path_name}_router)\n'
    include_statement += f'\npass\n'

    try:
        # main.py 파일을 읽고 `pass` 위치 찾기
        with MAIN_FILE_PATH.open("r", encoding="utf-8") as main_file:
            content = main_file.read()

        # `pass` 위치에 라우터 포함 코드를 삽입
        if "pass" in content:
            
            metadata_path = path_manager.deploy_path / "metadata.json"
            metadata = str_to_json(get_file(metadata_path))
            before_status = metadata["status"]

            if metadata["status"] == DeployStatus.RUNNING.value:
                stop()

            content = content.replace("pass", include_statement)

            # 수정된 내용을 main.py에 다시 쓰기
            with MAIN_FILE_PATH.open("w", encoding="utf-8") as main_file:
                main_file.write(content)

            if before_status == DeployStatus.RUNNING.value:
                run()
            return True
        else:
            return False
    except Exception as e:
        return False

def remove_router(uri: str) -> bool:

    path_name = uri.strip("/").replace("/", "_")
    file_path = ROUTER_DIR / f"{path_name}.py"
    
    json_path = path_manager.get_deploy_path() / f"{path_name}.json"
    if remove_file(json_path):
        logger.info(f"파일 삭제 완료: {json_path}")
    else:
        logger.error(f"파일 삭제 실패: {json_path}")
        return False

    # 라우터 파일이 존재하면 삭제
    if file_path.exists():
        try:
            file_path.unlink()
            print(f"Deleted router file: {file_path}")
        except Exception as e:
            return False
    else:
        print(f"Router file '{file_path}' does not exist.")

    include_statement = f'from deploy_server.src.routers.{path_name} import router as {path_name}_router\n'
    include_statement += f'app.include_router({path_name}_router)\n'

    try:
        # main.py 파일을 읽고 삭제할 코드 부분 찾기
        with MAIN_FILE_PATH.open("r", encoding="utf-8") as main_file:
            content = main_file.read()

        # 삭제할 라우터 코드가 main.py에 포함된 경우에만 진행
        if include_statement in content:
            stop()
            content = content.replace(include_statement, "")

            # 수정된 내용을 main.py에 다시 쓰기
            with MAIN_FILE_PATH.open("w", encoding="utf-8") as main_file:
                main_file.write(content)
            run()
            print(f"Removed route registration for '{uri}' from main.py")
            return True
        else:
            print(f"No matching route registration found in main.py for '{uri}'")
            return False
    except Exception as e:
        return False
    
def get_api_list(page: int, page_size: int) -> Optional[list[ApiInformation]]:
    deploy_path = path_manager.get_deploy_path()
    deploy_list = [file_name for file_name in get_files(deploy_path) if file_name != 'metadata.json' ]
    api_list = handle_pagination(deploy_list, page, page_size)
    api_info_list = []

    if api_list is None:
        return None

    for api in api_list :
        file_path = deploy_path / api
        api_info_list.append(ApiInformation(**str_to_json(get_file(file_path))))

    return api_info_list