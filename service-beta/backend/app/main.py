from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import uuid
from contextlib import asynccontextmanager
from .routers import segment
from .utils.model import load_segmentation_model
import torch
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_segmentation_model()
    yield
    del app.state.model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


app = FastAPI(
    title="Liver CT Segmentation API",
    version="1.0.0",
    lifespan=lifespan,
)

UPLOAD_DIR = "/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# список фронтов, которым разрешено обращаться
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(segment.router)


@app.post("/upload")
async def upload_file(file: UploadFile = File(..., description="Файл объёма .nii / .nii.gz")):
    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}.nii")
    with open(save_path, "wb") as out:
        out.write(await file.read())
    return {"file_id": file_id}
