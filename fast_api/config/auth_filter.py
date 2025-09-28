from fastapi import Request, Response
from services.auth_service import decode_access_token

async def auth_filter(request: Request):
    # Allow all /auth/* routes, /api/translate, and /jobs/embed
    if (
        request.url.path.startswith('/auth') or
        request.url.path.startswith('/api/translate') or
        request.url.path == '/jobs/embed'
    ):
        return None
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response(content="Unauthorized access", status_code=403)
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        return Response(content="Invalid or expired token", status_code=403)
    return None
