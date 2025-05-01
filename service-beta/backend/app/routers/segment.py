import base64
import os
import tempfile
from typing import List

import cv2
import numpy as np
import torch
from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field

from ..utils.contours import find_contours
from ..utils.model import DEVICE
from ..utils.preprocess import apply_transformations, preprocess_im, read_nii


router = APIRouter(prefix="/segment", tags=["Segmentation"])


class SegmentationResponse(BaseModel):
    """JSON-схема ответа сегментации одного среза."""

    slice_index: int = Field(..., description="Индекс среза (ось Z, 0-based)")
    depth: int
    mask: List[List[int]] = Field(..., description="Бинарная маска 256×256 (0/1)")
    contours: List[List[List[int]]] = Field(
        ..., description="Контуры — список точек [[x,y], …]"
    )
    image: str = Field(
        ...,
        description="PNG-срез, закодированный как data-URI (base64)",
        example="data:image/png;base64,iVBORw0KGgoAAA…",
    )


@router.post("/", response_model=SegmentationResponse, summary="Сегментация среза")
async def segment_liver_slice(
    request: Request,
    file: UploadFile = File(..., description="Файл объёма .nii / .nii.gz"),
    slice_idx: int = Query(..., ge=0, description="Номер среза (ось Z)"),
):
    """
    Получает один срез КТ, предсказывает маску печени,
    возвращает маску, контур **и** сам срез (PNG base64),
    чтобы фронт мог нарисовать подложку + контур.
    """
    model = request.app.state.model  # ← загружен в lifespan
    tmp_path: str | None = None

    try:
        # -------- 1. сохраняем загруженный `.nii` во временный файл -------- #
        suffix = ".nii.gz" if file.filename.endswith(".gz") else ".nii"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # -------- 2. читаем объём и валидируем индекс -------- #
        volume = read_nii(tmp_path)  # (H, W, Z)
        if slice_idx >= volume.shape[2]:
            raise HTTPException(
                status_code=400,
                detail=f"slice_idx out of range 0–{volume.shape[2] - 1}",
            )

        # -------- 3. препроцессинг одного среза -------- #
        slice_raw = volume[:, :, slice_idx]
        slice_norm = preprocess_im(slice_raw)  # 0-1 float32
        batch = apply_transformations(slice_norm).to(DEVICE)  # (1,1,256,256)

        # -------- 4. инференс -------- #
        with torch.no_grad():
            logit = model(batch)

        mask = (torch.sigmoid(logit) > 0.5).cpu().numpy()[0, 0].astype(np.uint8)

        # -------- 5. кодируем сам срез в PNG-base64 -------- #
        slice_png = (slice_norm * 255).astype(np.uint8)  # обратно в 0-255
        _, buf = cv2.imencode(".png", slice_png)
        data_uri = (
            "data:image/png;base64," + base64.b64encode(buf).decode("ascii")
        )

        # -------- 6. контуры -------- #
        contours = find_contours(mask)

        return {
            "slice_index": slice_idx,
            "mask": mask.tolist(),
            "contours": contours,
            "image": data_uri,
            "depth": int(volume.shape[2])
        }

    finally:
        # чистим tmp-файл
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
