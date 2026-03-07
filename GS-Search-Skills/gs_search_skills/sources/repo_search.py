from typing import Any, Dict, List, Optional

from gs_search_skills.github_api import GithubClient


def build_repo_query(keyword: str, min_stars: int) -> str:
    kw = (keyword or "").strip()
    stars = max(min_stars, 0)
    base = f'{kw} in:name,description,readme stars:>={stars} archived:false'
    return base.strip()


def search_repositories(
    gh: GithubClient,
    keywords: List[str],
    min_stars: int,
    max_results: int,
) -> List[Dict[str, Any]]:
    repos: List[Dict[str, Any]] = []
    for kw in keywords:
        q = build_repo_query(kw, min_stars=min_stars)
        try:
            r = gh.search_repositories(q, per_page=min(max_results, 50), page=1)
        except Exception:
            continue
        for it in (r.get("items") or []):
            repos.append(
                {
                    "type": "repo",
                    "owner": (it.get("owner") or {}).get("login") or "",
                    "repo": it.get("name") or "",
                    "full_name": it.get("full_name") or "",
                    "html_url": it.get("html_url") or "",
                    "matched_keyword": kw,
                    "stargazers_count": int(it.get("stargazers_count") or 0),
                    "description": it.get("description") or "",
                    "language": it.get("language") or "",
                    "updated_at": it.get("updated_at") or "",
                }
            )
            if len(repos) >= max_results:
                break
        if len(repos) >= max_results:
            break
    return _dedupe(repos)


def _dedupe(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    out: List[Dict[str, Any]] = []
    for it in items:
        k = it.get("full_name") or f"{it.get('owner')}/{it.get('repo')}"
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out

