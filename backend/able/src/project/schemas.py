from src.response.schemas import ImmutableBaseModel
from typing import List

class Project(ImmutableBaseModel):
    title: str                          # 프로젝트명 
    description: str | None = None      # 프로젝트 설명(선택)
    cuda_version: str                   # 쿠다 버전
    python_kernel_path: str             # 파이썬 커널

class SelectedProject(Project):
    thumbnail: str | None = None        # 썸네일
    class Config:
        frozen = False  # 불변성 해제

class ProjectResponse(ImmutableBaseModel):
    project: SelectedProject

class UpdatedProject(Project):
    prev_title: str                     # 변경 전 프로젝트명
    prev_description: str | None = None # 변경 전 설명

class ProjectsResponse(ImmutableBaseModel):
    projects: List[str]
