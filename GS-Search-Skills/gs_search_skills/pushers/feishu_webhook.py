import base64
import hashlib
import hmac
import time
from typing import Any, Dict, Optional

import httpx


def send_webhook(
    webhook_url: str,
    msg_type: str,
    content: Dict[str, Any],
    secret: Optional[str] = None,
    timeout_s: float = 20.0,
) -> Dict[str, Any]:
    url = (webhook_url or "").strip()
    if not url:
        raise RuntimeError("缺少飞书 webhook_url：请配置 feishu.webhook_url 或导出 FEISHU_WEBHOOK_URL")

    payload: Dict[str, Any] = {
        "msg_type": msg_type,
        "content": _normalize_content(msg_type, content),
    }

    if secret:
        ts = str(int(time.time()))
        payload["timestamp"] = ts
        payload["sign"] = _sign(ts, secret)

    with httpx.Client(timeout=timeout_s) as client:
        r = client.post(url, json=payload)
        r.raise_for_status()
        data = r.json() if (r.headers.get("content-type") or "").startswith("application/json") else {"text": r.text}

    if isinstance(data, dict) and data.get("code") not in (0, None):
        raise RuntimeError(f"飞书 webhook 发送失败：{data.get('msg') or data}")
    return data if isinstance(data, dict) else {"data": data}


def _normalize_content(msg_type: str, content: Dict[str, Any]) -> Dict[str, Any]:
    if msg_type == "text":
        if "text" in content:
            return {"text": content.get("text") or ""}
        return {"text": ""}
    if msg_type == "post":
        if "post" in content:
            return {"post": content.get("post")}
        return {"post": content}
    return content


def _sign(timestamp: str, secret: str) -> str:
    key = (secret or "").encode("utf-8")
    msg = f"{timestamp}\n{secret}".encode("utf-8")
    digest = hmac.new(key, msg, hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")

