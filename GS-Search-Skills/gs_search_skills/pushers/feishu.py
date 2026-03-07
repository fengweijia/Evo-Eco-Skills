import json
from typing import Any, Dict, Optional

import httpx


def get_tenant_access_token(app_id: str, app_secret: str, timeout_s: float = 20.0) -> str:
    if not app_id or not app_secret:
        raise RuntimeError("缺少飞书 app_id/app_secret")
    if "${" in app_id or "}" in app_id or "${" in app_secret or "}" in app_secret:
        raise RuntimeError("飞书 app_id/app_secret 看起来是未解析的 ${ENV} 占位符，请在 shell 里 export 对应环境变量")
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    with httpx.Client(timeout=timeout_s) as client:
        r = client.post(url, json={"app_id": app_id, "app_secret": app_secret})
        r.raise_for_status()
        data = r.json() or {}
    if data.get("code") != 0:
        raise RuntimeError(f"飞书 token 获取失败：{data.get('msg') or data}（请检查 app_id/app_secret 是否正确，以及是否为飞书开放平台应用）")
    return data.get("tenant_access_token") or ""


def send_message(
    token: str,
    receive_id_type: str,
    receive_id: str,
    msg_type: str,
    content: Dict[str, Any],
    timeout_s: float = 20.0,
) -> Dict[str, Any]:
    if not token:
        raise RuntimeError("缺少飞书 tenant_access_token")
    if not receive_id:
        raise RuntimeError("缺少飞书 receive_id")
    url = f"https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type={receive_id_type}"
    headers = {"Authorization": f"Bearer {token}"}
    payload: Dict[str, Any] = {
        "receive_id": receive_id,
        "msg_type": msg_type,
        "content": "",
    }

    if msg_type == "text":
        payload["content"] = json.dumps({"text": content.get("text") or ""}, ensure_ascii=False)
    elif msg_type == "post":
        payload["content"] = json.dumps({"post": content}, ensure_ascii=False)
    else:
        payload["content"] = json.dumps(content, ensure_ascii=False)

    with httpx.Client(timeout=timeout_s) as client:
        r = client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json() or {}
    if data.get("code") not in (0, None):
        raise RuntimeError(f"飞书消息发送失败：{data.get('msg') or data}")
    return data
