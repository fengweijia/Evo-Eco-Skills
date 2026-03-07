from datetime import datetime
from typing import Any, Dict, List


def build_post_content(title: str, sections: List[Dict[str, Any]]) -> Dict[str, Any]:
    content: List[List[Dict[str, Any]]] = []
    for sec in sections:
        h = sec.get("title") or ""
        if h:
            content.append([{"tag": "text", "text": f"{h}\n"}])
        for line in (sec.get("lines") or []):
            content.append([{"tag": "text", "text": line}])
    return {
        "zh_cn": {
            "title": title,
            "content": content,
        }
    }


def format_scan_result_to_sections(result: Dict[str, Any], max_items: int = 10) -> List[Dict[str, Any]]:
    skills = result.get("skills") or []
    repos = result.get("repos") or []
    sections: List[Dict[str, Any]] = []

    if skills:
        lines: List[str] = []
        for it in skills[:max_items]:
            name = it.get("skill_name") or it.get("repo") or ""
            full = f"{it.get('owner')}/{it.get('repo')}"
            stars = it.get("stars")
            analysis = it.get("analysis") or {}
            summary = analysis.get("summary_one_line") or ""
            extra = _pick_points(analysis, limit=2)
            url = it.get("html_url") or it.get("skills_sh_url") or ""
            install = it.get("install") or ""
            parts = [f"• {name}（{full}）"]
            if stars is not None:
                parts.append(f"⭐ {stars}")
            if summary:
                parts.append(f"\n  {summary}")
            for t, c in extra:
                parts.append(f"\n  {t}：{c}")
            if url:
                parts.append(f"\n  {url}")
            if install:
                parts.append(f"\n  {install}")
            lines.append("".join(parts) + "\n")
        sections.append({"title": "技能发现", "lines": lines})

    if repos:
        lines = []
        for it in repos[:max_items]:
            full = it.get("full_name") or f"{it.get('owner')}/{it.get('repo')}"
            stars = it.get("stars")
            analysis = it.get("analysis") or {}
            summary = analysis.get("summary_one_line") or ""
            extra = _pick_points(analysis, limit=2)
            url = it.get("html_url") or ""
            parts = [f"• {full}"]
            if stars is not None:
                parts.append(f" ⭐ {stars}")
            if summary:
                parts.append(f"\n  {summary}")
            for t, c in extra:
                parts.append(f"\n  {t}：{c}")
            if url:
                parts.append(f"\n  {url}")
            lines.append("".join(parts) + "\n")
        sections.append({"title": "项目发现", "lines": lines})

    meta = result.get("meta") or {}
    kw = ", ".join(meta.get("keywords") or [])
    if kw:
        sections.append({"title": "本次关键词", "lines": [kw + "\n"]})

    return sections


def _pick_points(analysis: Dict[str, Any], limit: int) -> List[tuple]:
    pts = analysis.get("points") or []
    if not isinstance(pts, list):
        return []
    out: List[tuple] = []
    for p in pts:
        if not isinstance(p, dict):
            continue
        t = (p.get("title") or "").strip()
        c = (p.get("claim_text") or "").strip()
        if not t or not c:
            continue
        if t in ("一行总结", "要点摘要"):
            continue
        out.append((t, c[:180]))
        if len(out) >= limit:
            break
    return out


def default_title(prefix: str = "技能/开源情报") -> str:
    d = datetime.now().strftime("%Y-%m-%d")
    return f"{prefix} - {d}"
