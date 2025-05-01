from fastapi import FastAPI
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
