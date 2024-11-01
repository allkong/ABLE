import logging
from fastapi import Response
from typing import TypeVar
from starlette.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT
from src.response.schemas import ResponseModel

logger = logging.getLogger(__name__)
T = TypeVar("T")

def ok(data: T) -> Response:
    status_code=HTTP_200_OK
    content = ResponseModel[T](
        status_code=status_code,
        data=data
    )

    return Response(
        content=content.model_dump_json(exclude_none=True),
        status_code=status_code,
        media_type="application/json",
    )

def created() -> Response:
    status_code=HTTP_201_CREATED

    return Response(
        status_code = status_code,
        media_type="application/json"
    )

def no_content() -> Response:
    status_code = HTTP_204_NO_CONTENT
    return Response(
        status_code=status_code,
        media_type="application/json"
    )