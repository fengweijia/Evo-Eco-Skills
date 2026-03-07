from typing import Any, Dict

from gs_search_skills.config import ScannerConfig
from gs_search_skills.formatters.feishu_post import build_post_content, default_title, format_scan_result_to_sections
from gs_search_skills.pushers.feishu import get_tenant_access_token, send_message
from gs_search_skills.pushers.feishu_webhook import send_webhook


def push_result_to_feishu(result: Dict[str, Any], config: ScannerConfig) -> Dict[str, Any]:
    sections = format_scan_result_to_sections(result)
    post_content = build_post_content(default_title(), sections)

    webhook_url = (config.feishu.webhook_url or "").strip()
    if webhook_url:
        return send_webhook(
            webhook_url=webhook_url,
            msg_type=config.feishu.msg_type,
            content={"post": post_content} if config.feishu.msg_type == "post" else post_content,
            secret=(config.feishu.webhook_secret or "").strip() or None,
        )

    receive_id = (config.feishu.receive_id or "").strip()
    receive_id_type = (config.feishu.receive_id_type or "").strip() or "chat_id"
    if not receive_id:
        if receive_id_type == "chat_id":
            raise RuntimeError("缺少飞书 receive_id：请配置 feishu.receive_id 或导出 FEISHU_CHAT_ID / FEISHU_RECEIVE_ID")
        raise RuntimeError("缺少飞书 receive_id：请配置 feishu.receive_id 或导出 FEISHU_RECEIVE_ID")
    token = get_tenant_access_token(config.feishu.app_id, config.feishu.app_secret)
    return send_message(
        token=token,
        receive_id_type=receive_id_type,
        receive_id=receive_id,
        msg_type=config.feishu.msg_type,
        content=post_content,
    )
