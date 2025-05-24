from __future__ import annotations

import base64
import io
import os
import tempfile
from typing import List
from uuid import uuid4

import cv2
import numpy as np
import torch
from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile

from app.service.minio_client import minio_client
from ..utils.contours import find_contours
from ..utils.model import DEVICE
from ..utils.preprocess import apply_transformations, preprocess_im, read_nii
from app.models.segmentation import SegmentationResponse

router = APIRouter(prefix="/segment", tags=["Segmentation"])
MINIO_BUCKET_NAME = "medical-images"

print("LOADED SEGMENT ROUTER")


@router.post("/upload/", summary="Загрузить .nii(.gz) файл",
             description="Загружает медицинский томографический файл в MinIO. Возвращает file_id, preview_image и информацию об объеме.")
async def upload_volume(
        file: UploadFile = File(..., description="Файл объёма .nii или .nii.gz")
):
    file_id = str(uuid4())
    object_name = f"{file_id}.nii.gz" if file.filename.endswith(".gz") else f"{file_id}.nii"
    tmp_path = None

    try:
        # Проверка и создание бакета
        if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
            minio_client.make_bucket(MINIO_BUCKET_NAME)

        # Чтение файла
        file_content = await file.read()

        # Сохранение в MinIO
        minio_client.put_object(
            MINIO_BUCKET_NAME,
            object_name,
            data=io.BytesIO(file_content),
            length=len(file_content),
            content_type=file.content_type,
        )

        # Сохранение во временный файл для чтения
        suffix = ".nii.gz" if file.filename.endswith(".gz") else ".nii"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        # Чтение и обработка объема
        volume = read_nii(tmp_path)
        depth = volume.shape[2]  # Получаем количество срезов

        # Нормализация и подготовка превью
        first_slice = volume[:, :, 0]
        slice_norm = (first_slice - np.min(first_slice)) / (np.max(first_slice) - np.min(first_slice) + 1e-8)
        slice_png = (slice_norm * 255).clip(0, 255).astype(np.uint8)

        # Кодирование в PNG
        _, buf = cv2.imencode(".png", slice_png)
        data_uri = "data:image/png;base64," + base64.b64encode(buf).decode("ascii")

        return {
            "file_id": file_id,
            "preview_image": data_uri,
            "depth": depth,  # Добавляем информацию о количестве срезов
            "shape": list(volume.shape)  # Добавляем информацию о размерах
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Гарантированное удаление временного файла
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Could not remove temp file: {str(e)}")


@router.get("/preview-slice/", summary="Получить PNG-срез", description="Извлекает конкретный срез (по индексу) из загруженного тома и возвращает его как PNG base64.")
async def get_slice(request: Request, file_id: str, slice_idx: int = Query(..., ge=0)):
    redis_client = request.app.state.redis
    cache_key = f"slice:{file_id}:{slice_idx}"

    # Попробуем из Redis
    cached = await redis_client.get(cache_key)
    if cached:
        return {"image": cached.decode(), "depth": -1}  # глубина не кэшируем пока

    object_name = f"{file_id}.nii.gz"
    try:
        response = minio_client.get_object(MINIO_BUCKET_NAME, object_name)
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            tmp_file.write(response.read())
            tmp_path = tmp_file.name
        volume = read_nii(tmp_path)
        os.remove(tmp_path)

        if slice_idx >= volume.shape[2]:
            raise HTTPException(status_code=400, detail="slice_idx out of range")

        slice_image = volume[:, :, slice_idx]
        slice_norm = preprocess_im(slice_image)
        slice_png = (slice_norm * 255).astype(np.uint8)
        _, buf = cv2.imencode(".png", slice_png)
        data_uri = "data:image/png;base64," + base64.b64encode(buf).decode("ascii")

        await redis_client.set(cache_key, data_uri, ex=3600)  # 1 час

        return {"image": data_uri, "depth": int(volume.shape[2])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/", summary="Список загруженных томов", description="Возвращает список всех загруженных `.nii` или `.nii.gz` файлов (только ID).")
async def list_uploaded_files():
    try:
        objects = minio_client.list_objects(MINIO_BUCKET_NAME, recursive=True)
        file_ids = set()
        for obj in objects:
            if obj.object_name.endswith((".nii", ".nii.gz")):
                file_ids.add(obj.object_name.split(".")[0])
        return {"file_ids": list(file_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/", response_model=SegmentationResponse, summary="Сегментация печени", description="Выполняет сегментацию печени по загруженному срезу. Возвращает маску, контуры и изображение.")
async def segment_liver_slice(
    request: Request,
    file: UploadFile = File(..., description="Файл объёма .nii или .nii.gz"),
    slice_idx: int = Query(..., ge=0, description="Индекс среза (ось Z)"),
):
    model = request.app.state.model
    redis_client = request.app.state.redis
    tmp_path = None

    # Генерируем ключ для кэша по хэшу файла и индексу среза
    file_bytes = await file.read()
    file_hash = str(hash(file_bytes))
    cache_key = f"predict:{file_hash}:{slice_idx}"

    cached = await redis_client.get(cache_key)
    if cached:
        import json
        return json.loads(cached.decode())

    try:
        suffix = ".nii.gz" if file.filename.endswith(".gz") else ".nii"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        volume = read_nii(tmp_path)
        if slice_idx >= volume.shape[2]:
            raise HTTPException(400, f"slice_idx out of range 0–{volume.shape[2] - 1}")

        slice_raw = volume[:, :, slice_idx]
        slice_norm = preprocess_im(slice_raw)
        batch = apply_transformations(slice_norm).to(DEVICE)

        with torch.no_grad():
            logit = model(batch)
        mask = (torch.sigmoid(logit) > 0.5).cpu().numpy()[0, 0].astype(np.uint8)

        slice_png = (slice_norm * 255).astype(np.uint8)
        _, buf = cv2.imencode(".png", slice_png)
        data_uri = "data:image/png;base64," + base64.b64encode(buf).decode("ascii")

        contours = find_contours(mask)

        result = {
            "slice_index": slice_idx,
            "mask": mask.tolist(),
            "contours": contours,
            "image": data_uri,
            "depth": int(volume.shape[2])
        }

        import json
        await redis_client.set(cache_key, json.dumps(result), ex=3600)

        return result

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


from fastapi import status, Query

@router.delete(
    "/delete/{file_id}",
    summary="Удалить файл и (опционально) маски",
    description="Удаляет .nii/.nii.gz и, если указано, маски, связанные с file_id."
)
async def delete_file(file_id: str, delete_masks: bool = Query(default=False, description="Удалять ли маски")):
    try:
        deleted_files = []

        # Удаление основного файла (nii или nii.gz)
        for suffix in [".nii", ".nii.gz"]:
            object_name = f"{file_id}{suffix}"
            try:
                minio_client.remove_object(MINIO_BUCKET_NAME, object_name)
                deleted_files.append(object_name)
            except Exception:
                pass  # Файл мог не существовать — не ошибка

        # Удаление масок, если включено
        if delete_masks:
            objects = minio_client.list_objects(MINIO_BUCKET_NAME, prefix=f"{file_id}_mask_", recursive=True)
            for obj in objects:
                try:
                    minio_client.remove_object(MINIO_BUCKET_NAME, obj.object_name)
                    deleted_files.append(obj.object_name)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Ошибка при удалении маски: {str(e)}")

        if not deleted_files:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файлы не найдены")

        return {
            "message": "Файлы удалены",
            "deleted": deleted_files,
            "masks_deleted": delete_masks
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении: {str(e)}")
