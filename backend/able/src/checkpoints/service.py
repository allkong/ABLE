import logging

from src.file.path_manager import PathManager
from src.file.utils import get_directory, read_image_file, save_img, create_directory, get_file
from src.train.utils import ACCURACY
from src.utils import encode_image_to_base64, str_to_json, handle_pagination, has_next_page
from src.train.schemas import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pathManager = PathManager()


ACCURACY_PATH = "accuracy.json"

def get_checkpoints(project_name: str, result_name: str) -> list[str]:
    checkpoints_path = pathManager.get_checkpoints_path(project_name, result_name)
    checkpoints = get_directory(checkpoints_path)

    paths = [epoch.name for epoch in checkpoints]

    # for checkpoint_path in checkpoints:
    #     accuracy_data = str_to_json(get_file(checkpoint_path / "accuracy.json"))
    #     print(Accuracy(accuracy=accuracy_data["accuracy"]))

    # print(checkpoints)

    return paths