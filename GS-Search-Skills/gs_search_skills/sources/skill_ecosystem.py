import re
from typing import Any, Dict, List, Tuple

from gs_search_skills.github_api import GithubClient
from gs_search_skills.sources.skills_cli import find_skills_via_cli


def _extract_skill_name_from_path(path: str) -> str:
    p = (path or "").strip().strip("/")
    if not p:
        return ""
    parts = p.split("/")
    if len(parts) >= 2 and parts[-1].lower() == "skill.md":
        return parts[-2]
    if len(parts) >= 2 and parts[-1].lower() == "skill.yaml":
        return parts[-2]
    return parts[-1].rsplit(".", 1)[0]


def _extract_github_repos_from_text(text: str) -> List[str]:
    pat = re.compile(r"https?://github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)")
    out: List[str] = []
    for m in pat.finditer(text or ""):
        out.append(m.group(1))
    seen = set()
    uniq: List[str] = []
    for r in out:
        if r not in seen:
            seen.add(r)
            uniq.append(r)
    return uniq


def _skill_item(
    owner: str,
    repo: str,
    skill_name: str,
    keyword: str,
    source: str,
    skill_file_url: str = "",
) -> Dict[str, Any]:
    install = ""
    skills_sh = ""
    if owner and repo and skill_name:
        install = f"npx skills add {owner}/{repo}@{skill_name}"
        skills_sh = f"https://skills.sh/{owner}/{repo}/{skill_name}"
    elif owner and repo:
        install = f"npx skills add {owner}/{repo}"
        skills_sh = f"https://skills.sh/{owner}/{repo}"
    return {
        "type": "skill",
        "owner": owner,
        "repo": repo,
        "skill_name": skill_name,
        "source": source,
        "matched_keyword": keyword,
        "skill_file_url": skill_file_url,
        "install": install,
        "skills_sh_url": skills_sh,
    }


def collect_skill_candidates(
    gh: GithubClient,
    keywords: List[str],
    max_results: int = 20,
    include_agent_skills: bool = True,
    include_awesome: bool = True,
    include_global_code_search: bool = True,
) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    items.extend(find_skills_via_cli(keywords, max_results=max_results))

    if include_agent_skills:
        items.extend(_search_agent_skills_repo(gh, keywords, max_results=max_results))

    if include_awesome:
        items.extend(_search_awesome_claude_skills(gh, keywords, max_results=max_results))

    if include_global_code_search:
        items.extend(_search_global_skill_docs(gh, keywords, max_results=max_results))

    return items


def _search_agent_skills_repo(gh: GithubClient, keywords: List[str], max_results: int) -> List[Dict[str, Any]]:
    owner = "vercel-labs"
    repo = "agent-skills"
    out: List[Dict[str, Any]] = []
    for kw in keywords:
        q = f"repo:{owner}/{repo} filename:SKILL.md {kw}"
        try:
            r = gh.search_code(q, per_page=min(max_results, 50), page=1)
        except Exception:
            continue
        for it in (r.get("items") or []):
            path = it.get("path") or ""
            skill_name = _extract_skill_name_from_path(path)
            out.append(
                _skill_item(
                    owner=owner,
                    repo=repo,
                    skill_name=skill_name,
                    keyword=kw,
                    source="vercel-labs/agent-skills",
                    skill_file_url=it.get("html_url") or "",
                )
            )
    return _dedupe(out, key=lambda x: (x.get("owner"), x.get("repo"), x.get("skill_name")))


def _search_awesome_claude_skills(gh: GithubClient, keywords: List[str], max_results: int) -> List[Dict[str, Any]]:
    awesome_candidates: List[Tuple[str, str]] = [
        ("ComposioHQ", "awesome-claude-skills"),
    ]
    out: List[Dict[str, Any]] = []
    for owner, repo in awesome_candidates:
        try:
            readme = gh.get_readme_text(owner, repo)
        except Exception:
            continue
        repos = _extract_github_repos_from_text(readme)
        for full in repos:
            low = full.lower()
            if not any((kw or "").lower() in low for kw in keywords if kw):
                continue
            o, r = full.split("/", 1)
            out.append(
                _skill_item(
                    owner=o,
                    repo=r,
                    skill_name="",
                    keyword=_first_match(low, keywords),
                    source="awesome-claude-skills",
                    skill_file_url=f"https://github.com/{owner}/{repo}",
                )
            )
            if len(out) >= max_results:
                break
        if len(out) >= max_results:
            break
    return _dedupe(out, key=lambda x: (x.get("owner"), x.get("repo"), x.get("skill_name")))

def _search_global_skill_docs(gh: GithubClient, keywords: List[str], max_results: int) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for kw in keywords:
        q = f"filename:SKILL.md {kw}"
        try:
            r = gh.search_code(q, per_page=min(max_results, 50), page=1)
        except Exception:
            continue
        for it in (r.get("items") or []):
            repo_full = ((it.get("repository") or {}).get("full_name") or "").strip()
            if "/" not in repo_full:
                continue
            owner, repo = repo_full.split("/", 1)
            path = it.get("path") or ""
            skill_name = _extract_skill_name_from_path(path)
            out.append(
                _skill_item(
                    owner=owner,
                    repo=repo,
                    skill_name=skill_name,
                    keyword=kw,
                    source="skills.sh (github code search)",
                    skill_file_url=it.get("html_url") or "",
                )
            )
            if len(out) >= max_results:
                break
        if len(out) >= max_results:
            break
    return _dedupe(out, key=lambda x: (x.get("owner"), x.get("repo"), x.get("skill_name")))


def _first_match(text_low: str, keywords: List[str]) -> str:
    for kw in keywords:
        if kw and kw.lower() in text_low:
            return kw
    return keywords[0] if keywords else ""


def _dedupe(items: List[Dict[str, Any]], key) -> List[Dict[str, Any]]:
    seen = set()
    out: List[Dict[str, Any]] = []
    for it in items:
        k = key(it)
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out
