import logging

from src.checkpoints.schemas import CheckpointListResponse
from src.file.path_manager import PathManager
from src.file.utils import get_directory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pathManager = PathManager()


ACCURACY_PATH = "accuracy.json"

def get_checkpoints(project_name: str, result_name: str) -> CheckpointListResponse:
    checkpoints_path = pathManager.get_checkpoints_path(project_name, result_name)
    checkpoints = get_directory(checkpoints_path)

    paths = [epoch.name for epoch in checkpoints]

    result = CheckpointListResponse(checkpoints=paths)
    return result