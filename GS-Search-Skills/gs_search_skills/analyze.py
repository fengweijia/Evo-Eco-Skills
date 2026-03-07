import json
from typing import Any, Dict, List, Optional

import httpx

from gs_search_skills.config import LlmConfig


def analyze_repo_text(
    text: str,
    meta: Dict[str, Any],
    llm: Optional[LlmConfig] = None,
) -> Dict[str, Any]:
    if llm and llm.enabled and llm.api_key:
        try:
            return _analyze_with_openai_compatible(text=text, meta=meta, llm=llm)
        except Exception:
            pass
    return _analyze_fallback(text=text, meta=meta)


def _analyze_fallback(text: str, meta: Dict[str, Any]) -> Dict[str, Any]:
    desc = (meta.get("description") or "").strip()
    topics = meta.get("topics") or []
    if not isinstance(topics, list):
        topics = []
    head = "\n".join([ln for ln in (text or "").splitlines() if ln.strip()][:40]).strip()
    summary = desc or (head[:160].strip())
    points: List[Dict[str, Any]] = []
    if summary:
        points.append(
            {
                "title": "要点摘要",
                "claim_text": summary[:240],
                "evidence_text": "",
                "method": "",
                "anchors": [],
                "tags": topics[:8],
            }
        )
    return {
        "summary_one_line": summary[:240] if summary else "",
        "points": points,
        "raw": {"mode": "fallback"},
    }


def _analyze_with_openai_compatible(text: str, meta: Dict[str, Any], llm: LlmConfig) -> Dict[str, Any]:
    prompt = (
        "你是资深开发者与产品经理。请基于给定的 GitHub 项目信息，输出 JSON：\n"
        '{ "summary_one_line": "...", "use_cases": ["..."], "audience": ["..."], "integration": ["..."], "risks": ["..."] }\n'
        "要求：中文，简洁、有可执行建议，不要输出多余字段。"
    )
    payload = {
        "model": llm.model,
        "messages": [
            {"role": "system", "content": "你擅长阅读开源项目并提炼使用场景。"},
            {"role": "user", "content": prompt},
            {
                "role": "user",
                "content": json.dumps({"meta": meta, "text": (text or "")[:12000]}, ensure_ascii=False),
            },
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    url = (llm.base_url.rstrip("/") + "/chat/completions").strip()
    headers = {"Authorization": f"Bearer {llm.api_key}", "Content-Type": "application/json"}
    with httpx.Client(timeout=llm.timeout_s) as client:
        r = client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()
    content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or "{}"
    obj = json.loads(content)
    summary = (obj.get("summary_one_line") or "").strip()
    def _lst(k: str) -> List[str]:
        v = obj.get(k)
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return []
    use_cases = _lst("use_cases")
    audience = _lst("audience")
    integration = _lst("integration")
    risks = _lst("risks")
    points: List[Dict[str, Any]] = []
    if summary:
        points.append(
            {
                "title": "一行总结",
                "claim_text": summary,
                "evidence_text": "",
                "method": "",
                "anchors": [],
                "tags": [],
            }
        )
    if use_cases:
        points.append(
            {
                "title": "使用场景",
                "claim_text": "；".join(use_cases[:6]),
                "evidence_text": "",
                "method": "",
                "anchors": [],
                "tags": [],
            }
        )
    if audience:
        points.append(
            {
                "title": "适用人群",
                "claim_text": "；".join(audience[:6]),
                "evidence_text": "",
                "method": "",
                "anchors": [],
                "tags": [],
            }
        )
    if integration:
        points.append(
            {
                "title": "集成方式",
                "claim_text": "；".join(integration[:6]),
                "evidence_text": "",
                "method": "",
                "anchors": [],
                "tags": [],
            }
        )
    if risks:
        points.append(
            {
                "title": "风险点",
                "claim_text": "；".join(risks[:6]),
                "evidence_text": "",
                "method": "",
                "anchors": [],
                "tags": [],
            }
        )
    return {
        "summary_one_line": summary,
        "points": points,
        "raw": {"mode": "llm", "provider": "openai_compatible"},
    }

