# API Rate Limiting

Rate limiting is now enabled to prevent API abuse and ensure fair usage.

## Implementation

Uses **slowapi** library with per-IP address rate limiting.

### Rate Limits

| Endpoint Type | Limit | Examples |
|--------------|-------|----------|
| **Standard API** | 100 req/min | GET /api/status, /api/prices |
| **Data-Heavy** | 30 req/min | GET /api/temperatures/history, /api/compare/* |
| **Write Operations** | 20 req/min | POST /api/schedule/toggle, PUT /api/config |
| **Authentication/Setup** | 5 req/min | POST /setup/*, POST /api/override |
| **Health Check** | Unlimited | GET /health |

### Strategy

- **Fixed Window**: Resets every minute
- **Per-IP**: Each IP address has independent limits
- **In-Memory**: Default storage (single instance)
- **Redis**: Optional for multi-worker deployments

## Configuration

### Default (In-Memory)

Works out of the box for single-instance deployments:

```python
# Already configured in app/main.py
from app.middleware.rate_limit import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### Production (Redis-Backed)

For multi-worker deployments, use Redis for shared rate limit state:

1. **Install Redis**:
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Linux
   sudo apt install redis-server
   sudo systemctl start redis
   ```

2. **Update Configuration**:
   ```python
   # In app/middleware/rate_limit.py
   limiter = Limiter(
       key_func=get_remote_address,
       storage_uri="redis://localhost:6379"
   )
   ```

3. **Install Redis client**:
   ```bash
   pip install redis
   ```

## Usage

### Apply to New Endpoints

```python
from fastapi import Request
from app.middleware.rate_limit import standard_limit, data_limit, write_limit, auth_limit

# Standard GET endpoint
@router.get("/myendpoint")
@standard_limit
async def my_endpoint(request: Request):
    return {"data": "value"}

# Data-heavy endpoint
@router.get("/heavy-data")
@data_limit
async def heavy_endpoint(request: Request):
    return {"large": "dataset"}

# Write endpoint
@router.post("/create")
@write_limit
async def create_endpoint(request: Request, data: MyModel):
    return {"created": True}

# Authentication endpoint
@router.post("/login")
@auth_limit
async def login(request: Request, credentials: LoginModel):
    return {"token": "..."}
```

### Custom Limits

```python
from app.middleware.rate_limit import limiter

# Custom limit: 50 requests per 5 minutes
@router.get("/custom")
@limiter.limit("50/5minute")
async def custom_endpoint(request: Request):
    return {"data": "value"}
```

## Response Headers

Rate-limited responses include headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1680000000
```

## Rate Limit Exceeded Response

When limit is exceeded:

```json
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded: 100 per 1 minute"
}
```

## Monitoring

### Check Current Limits

```bash
curl http://localhost:8000/api/status
# Check response headers for X-RateLimit-* values
```

### View Rate Limit Config

```python
from app.middleware.rate_limit import get_rate_limit_config

config = get_rate_limit_config()
# Returns current configuration dict
```

### Logs

Rate limit violations are logged:

```
WARNING - Rate limit exceeded for 192.168.1.100: /api/status
```

## Testing

### Test Rate Limit

```bash
# Exceed rate limit
for i in {1..105}; do
  curl http://localhost:8000/api/status
  sleep 0.1
done

# Should see 429 error on request #101
```

### Bypass for Testing

In development, you can disable rate limiting:

```python
# In app/main.py, comment out:
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

## Exempting IP Addresses

To exempt specific IPs (e.g., internal monitoring):

```python
# In app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

def custom_key_func(request):
    """Custom key function that exempts specific IPs"""
    ip = get_remote_address(request)
    
    # Exempt internal IPs
    exempt_ips = ["127.0.0.1", "10.0.0.0/8", "192.168.0.0/16"]
    
    if ip in exempt_ips:
        return None  # No rate limiting
    
    return ip

limiter = Limiter(key_func=custom_key_func)
```

## Performance Impact

- **Minimal**: ~1-2ms overhead per request
- **In-Memory**: Zero external dependencies
- **Redis**: ~0.5ms additional latency for Redis roundtrip

## Security Considerations

### IP Spoofing

Configure FastAPI to trust proxy headers if behind reverse proxy:

```python
# In app/main.py or uvicorn config
uvicorn.run(
    app,
    proxy_headers=True,
    forwarded_allow_ips="*"  # Or specific proxy IPs
)
```

### DDoS Protection

Rate limiting is NOT a replacement for DDoS protection:

- Use Cloudflare, AWS Shield, or similar
- Implement connection limits at reverse proxy (nginx)
- Use fail2ban for repeated violators

### Rate Limit Evasion

Determined attackers can evade IP-based limits:

- Use authentication-based rate limiting for sensitive endpoints
- Implement CAPTCHA for repeated violations
- Monitor for suspicious patterns

## Migration Path

Current implementation status:

✅ **Implemented**:
- Rate limiting middleware enabled
- Exception handler configured
- Core decorators created (`standard_limit`, `data_limit`, `write_limit`, `auth_limit`)
- Applied to key endpoints:
  - GET /api/status (standard)
  - GET /api/temperatures/history (data)
  - GET /api/compare/week (data)

⏳ **To Apply** (follow pattern above):
- POST /api/schedule/toggle (write)
- PUT /api/config (write)
- POST /api/override (write)
- POST /setup/* (auth)
- Other write/modify endpoints

## Troubleshooting

### slowapi not found

```bash
cd backend
pip install slowapi==0.1.9
```

### Redis connection error

```
# Check Redis is running
redis-cli ping
# Should return: PONG

# Or use in-memory (default)
```

### Rate limit not applying

- Ensure `@standard_limit` decorator is AFTER `@router.get(...)`
- Ensure `request: Request` parameter is added to function
- Check logs for rate limiter initialization

### Different limits for different users

Implement token-based rate limiting:

```python
def get_user_from_token(request):
    # Extract user from JWT or API key
    return request.headers.get("X-User-ID")

user_limiter = Limiter(key_func=get_user_from_token)
```

## References

- [slowapi Documentation](https://slowapi.readthedocs.io/)
- [FastAPI Rate Limiting Guide](https://fastapi.tiangolo.com/)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

---

**Status**: ✅ Rate Limiting Enabled
**Storage**: In-Memory (single instance)
**Coverage**: Core endpoints protected
**Next Steps**: Apply to remaining write/auth endpoints as needed
