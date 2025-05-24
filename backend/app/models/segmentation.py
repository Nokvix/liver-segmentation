from pydantic import BaseModel, Field
from typing import List


class SegmentationResponse(BaseModel):
    slice_index: int = Field(..., description="Индекс среза (ось Z, 0-based)")
    depth: int
    mask: List[List[int]] = Field(..., description="Бинарная маска 256×256 (0/1)")
    contours: List[List[List[int]]] = Field(
        ..., description="Контуры — список точек [[x,y], …]"
    )
    image: str = Field(
        ..., description="PNG-срез, закодированный как data-URI (base64)",
        example="data:image/png;base64,iVBORw0KGgoAAA…",
    )
