# app/routes/contour.py

from fastapi import APIRouter, HTTPException
from typing import List
import io
import json

from app.service.minio_client import minio_client

MINIO_BUCKET_NAME = "medical-images"
router = APIRouter(prefix="/contour", tags=["Contour"])


@router.post("/save", summary="Сохранить контур без изменений")
async def save_contour_mask(file_id: str, slice_idx: int, contours: List[List[List[float]]]):
    object_name = f"{file_id}_contour_{slice_idx}_v1.json"

    try:
        contour_data = {
            "version": 1,
            "edited": False,
            "contours": contours
        }
        with io.BytesIO() as buffer:
            buffer.write(json.dumps(contour_data).encode("utf-8"))
            buffer.seek(0)
            minio_client.put_object(
                MINIO_BUCKET_NAME,
                object_name,
                data=buffer,
                length=buffer.getbuffer().nbytes,
                content_type="application/json"
            )
        return {"message": "Контур сохранен (без изменений)", "object_name": object_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit", summary="Редактировать и сохранить контур")
async def edit_and_save_contour_mask(file_id: str, slice_idx: int, contours: List[List[List[float]]]):
    try:
        prefix = f"{file_id}_contour_{slice_idx}_v"
        versions = []

        for obj in minio_client.list_objects(MINIO_BUCKET_NAME, prefix=prefix, recursive=True):
            name = obj.object_name
            try:
                version_str = name.split("_v")[-1].split(".")[0]
                versions.append(int(version_str))
            except:
                continue

        next_version = max(versions, default=0) + 1
        object_name = f"{file_id}_contour_{slice_idx}_v{next_version}.json"

        contour_data = {
            "version": next_version,
            "edited": True,
            "contours": contours
        }

        with io.BytesIO() as buffer:
            buffer.write(json.dumps(contour_data).encode("utf-8"))
            buffer.seek(0)
            minio_client.put_object(
                MINIO_BUCKET_NAME,
                object_name,
                data=buffer,
                length=buffer.getbuffer().nbytes,
                content_type="application/json"
            )

        return {"message": "Контур отредактирован и сохранен", "object_name": object_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
