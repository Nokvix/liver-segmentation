# app/core/redis.py
from typing import Union
import redis.asyncio as redis

redis_client: Union[redis.Redis, None] = None

async def init_redis():
    global redis_client
    redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

async def close_redis():
    if redis_client:
        await redis_client.close()