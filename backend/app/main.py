from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers import segment
from app.routers import contour
from .utils.model import load_segmentation_model
import torch
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.redis import init_redis, close_redis, redis_client
from app.service.minio_client import minio_client, MINIO_BUCKET_NAME





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

@app.on_event("startup")
async def on_startup():
    await init_redis()
    app.state.redis = redis_client

    # ПРОВЕРКА БАКЕТА MinIO
    if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
        minio_client.make_bucket(MINIO_BUCKET_NAME)

@app.on_event("shutdown")
async def on_shutdown():
    await close_redis()


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
app.include_router(contour.router)
