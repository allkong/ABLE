import torch
import base64
import io
import numpy as np

from PIL import Image
from fastapi import APIRouter, Body
from deploy_server.src.schemas import InferenceResponse
from src.analysis.utils import read_blocks
from src.file.path_manager import PathManager
from src.file.utils import get_file
from src.response.utils import ok
from src.train.schemas import TrainResultMetadata
from src.train.utils import create_data_preprocessor, split_blocks
from src.utils import str_to_json
from src.file.constants import *

router = APIRouter()
path_manager = PathManager()

@router.post("/infer")
async def path_name_route(image: str = Body(...)):
    
    project_name = "string"
    train_result = "20241108_162624"
    checkpoint = "final"
    
    train_result_metadata_path = path_manager.get_train_result_path(project_name, train_result) / METADATA
    metadata = TrainResultMetadata(**str_to_json(get_file(train_result_metadata_path)))

    #block_graph.json 파일에서 블록 읽어오기
    block_graph_path = path_manager.get_train_result_path(project_name, train_result) / BLOCK_GRAPH
    block_graph = read_blocks(block_graph_path)

    # base64를 이미지로 변환 
    image = base64.b64decode(image)
    image = Image.open(io.BytesIO(image))
    image = np.array(image)
    
    # 블록 카테고리 별로 나누기
    _, transform_blocks, _, _, _ = split_blocks(block_graph.blocks)
    transforms = create_data_preprocessor(transform_blocks)
    
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    
    image = transforms(image)
    image.to(device)

    model = torch.load(path_manager.get_checkpoint_path(project_name, train_result, checkpoint) / {MODEL})
    
    model.to(device)
    
    predicted = model(image).cpu().numpy()
    
    max_value = predicted.max()
    predicted_idx = -1
    for idx, value in enumerate(predicted):
        if value == max_value:
            predicted_idx = idx
            break
        
    predicted_label = metadata.classes[predicted_idx]
    
    return ok(
        data=InferenceResponse(
            label = predicted_label,
            probablity = max_value
        )
    )
