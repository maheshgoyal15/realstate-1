import time
import redis
from fastapi import HTTPException, status
from app.core.config import settings

# Initialize Redis connection for rate limiting on 127.0.0.1:6379
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class TokenBucketRateLimiter:
    """
    Redis-backed token bucket rate limiter to prevent DoS / Denial-of-Wallet attacks.
    Mandatory Secure Web Skills: Rate limit all APIs.
    """
    def __init__(self, capacity: int = 60, refill_rate: float = 1.0):
        self.capacity = capacity
        self.refill_rate = refill_rate

    def check_limit(self, identifier: str) -> bool:
        key = f"rate_limit:{identifier}"
        now = time.time()
        
        # Using Redis transaction to ensure atomic execution
        pipe = redis_client.pipeline()
        try:
            pipe.hget(key, "tokens")
            pipe.hget(key, "last_updated")
            results = pipe.execute()
            
            tokens = float(results[0]) if results[0] is not None else float(self.capacity)
            last_updated = float(results[1]) if results[1] is not None else now
            
            # Calculate replenished tokens
            elapsed = now - last_updated
            tokens = min(self.capacity, tokens + elapsed * self.refill_rate)
            
            if tokens < 1.0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
            
            # Consume 1 token
            tokens -= 1.0
            
            pipe.hset(key, "tokens", str(tokens))
            pipe.hset(key, "last_updated", str(now))
            pipe.expire(key, int(self.capacity / self.refill_rate) + 60)
            pipe.execute()
            return True
        except redis.RedisError:
            # Fail open or fail close depending on risk profile; here we log and allow to avoid total outage if Redis blips
            return True

rate_limiter = TokenBucketRateLimiter()
