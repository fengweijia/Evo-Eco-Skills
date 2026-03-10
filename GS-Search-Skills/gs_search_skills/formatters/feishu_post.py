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
            why = _pick_why(analysis, fallback=summary)
            url = it.get("html_url") or it.get("skills_sh_url") or ""
            install = it.get("install") or ""
            parts = [f"【必看技能】{name}（{full}）"]
            if stars is not None:
                parts.append(f"⭐ {stars}")
            if why:
                parts.append(f"\n推荐理由：{why}")
            if url:
                parts.append(f"\n链接：{url}")
            if install:
                parts.append(f"\n安装：{install}")
            lines.append("".join(parts) + "\n")
        sections.append({"title": "必看技能（⭐≥2000）", "lines": lines})

    if repos:
        lines = []
        for it in repos[:max_items]:
            full = it.get("full_name") or f"{it.get('owner')}/{it.get('repo')}"
            stars = it.get("stars")
            analysis = it.get("analysis") or {}
            summary = analysis.get("summary_one_line") or ""
            why = _pick_why(analysis, fallback=summary)
            url = it.get("html_url") or ""
            parts = [f"【必看项目】{full}"]
            if stars is not None:
                parts.append(f" ⭐ {stars}")
            if why:
                parts.append(f"\n推荐理由：{why}")
            if url:
                parts.append(f"\n链接：{url}")
            lines.append("".join(parts) + "\n")
        sections.append({"title": "必看项目（⭐≥2000）", "lines": lines})

    if not sections:
        sections.append({"title": "本次无推荐", "lines": ["未找到符合 ⭐≥2000 的技能或项目。\n"]})

    return sections


def _pick_why(analysis: Dict[str, Any], fallback: str) -> str:
    pts = analysis.get("points") or []
    if not isinstance(pts, list):
        return (fallback or "").strip()
    preferred = {"使用场景", "集成方式", "风险点", "适用人群"}
    for p in pts:
        if not isinstance(p, dict):
            continue
        t = (p.get("title") or "").strip()
        c = (p.get("claim_text") or "").strip()
        if not t or not c:
            continue
        if t in preferred:
            return c[:220]
    for p in pts:
        if not isinstance(p, dict):
            continue
        t = (p.get("title") or "").strip()
        c = (p.get("claim_text") or "").strip()
        if not t or not c:
            continue
        if t in ("一行总结", "要点摘要"):
            continue
        return c[:220]
    return (fallback or "").strip()


def default_title(prefix: str = "技能/开源情报") -> str:
    d = datetime.now().strftime("%Y-%m-%d")
    return f"{prefix} - {d}"
