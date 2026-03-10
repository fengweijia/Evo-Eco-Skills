from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from gs_search_skills.analyze import analyze_repo_text
from gs_search_skills.config import ScannerConfig
from gs_search_skills.github_api import GithubClient
from gs_search_skills.sources.repo_search import search_repositories
from gs_search_skills.sources.skill_ecosystem import collect_skill_candidates


def run_scan(config: ScannerConfig, overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    kw = _merge_keywords(config, overrides or {})
    gh = GithubClient(token=config.github.token)

    skills: List[Dict[str, Any]] = []
    repos: List[Dict[str, Any]] = []

    if config.sources.skills_ecosystem:
        skills = collect_skill_candidates(gh, kw, max_results=config.github.max_results)

    if config.sources.github_repos:
        repos = search_repositories(
            gh,
            keywords=kw,
            min_stars=config.github.min_stars,
            max_results=config.github.max_results,
        )

    if config.sources.seed_repos:
        repos.extend(_seed_repos(config.github.seed_repos))

    skills_enriched = [_enrich_skill(gh, it, config=config) for it in skills]
    repos_enriched = [_enrich_repo(gh, it, config=config) for it in repos]

    recommend_min_stars = max(int(config.github.min_stars or 0), 2000)
    skills_enriched = [x for x in skills_enriched if int(x.get("stars") or 0) >= recommend_min_stars]
    repos_enriched = [x for x in repos_enriched if int(x.get("stars") or 0) >= recommend_min_stars]

    skills_final = _sort_and_dedupe(skills_enriched, key=lambda x: (x.get("owner"), x.get("repo"), x.get("skill_name")))
    repos_final = _sort_and_dedupe(repos_enriched, key=lambda x: (x.get("owner"), x.get("repo")))

    return {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "keywords": kw,
            "config_public": config.public_dict(),
        },
        "skills": skills_final,
        "repos": repos_final,
    }


def _merge_keywords(config: ScannerConfig, overrides: Dict[str, Any]) -> List[str]:
    kws: List[str] = []

    use_industries = (config.query.mode or "").strip().lower() == "industries" or bool(config.industries)
    if use_industries and config.industries:
        kws.extend(_build_industry_queries(config))
    else:
        kws.extend(config.keywords_cn or [])
        kws.extend(config.keywords_en or [])

    extra = overrides.get("keywords") or []
    if isinstance(extra, list):
        kws.extend([str(x) for x in extra])
    out: List[str] = []
    seen = set()
    for k in kws:
        s = (k or "").strip()
        if not s:
            continue
        if s.lower() in seen:
            continue
        seen.add(s.lower())
        out.append(s)
    return out


def _build_industry_queries(config: ScannerConfig) -> List[str]:
    out: List[str] = []
    max_combo_size = int(getattr(config.query, "max_combo_size", 3) or 3)
    max_per = int(getattr(config.query, "max_combos_per_industry", 120) or 120)
    max_combo_size = max(1, min(5, max_combo_size))
    if max_per < 0:
        max_per = 0

    for ind in config.industries or []:
        out.extend(_industry_lang_queries(ind.cn, max_combo_size=max_combo_size, max_out=max_per))
        out.extend(_industry_lang_queries(ind.en, max_combo_size=max_combo_size, max_out=max_per))
    return out


def _industry_lang_queries(lang, max_combo_size: int, max_out: int) -> List[str]:
    singles = [str(x).strip() for x in (getattr(lang, "singles", None) or []) if str(x).strip()]
    groups_raw = getattr(lang, "groups", None) or []
    groups: List[List[str]] = []
    for g in groups_raw:
        if not isinstance(g, list):
            continue
        gg = [str(x).strip() for x in g if str(x).strip()]
        if gg:
            groups.append(gg)

    out: List[str] = []
    out.extend(singles)
    for g in groups:
        out.extend(g)

    produced = 0
    if max_out == 0:
        return out

    if len(groups) >= 2 and max_combo_size >= 2:
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                for a in groups[i]:
                    for b in groups[j]:
                        out.append(f"{a} {b}".strip())
                        produced += 1
                        if produced >= max_out:
                            return out

    if len(groups) >= 3 and max_combo_size >= 3:
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                for k in range(j + 1, len(groups)):
                    for a in groups[i]:
                        for b in groups[j]:
                            for c in groups[k]:
                                out.append(f"{a} {b} {c}".strip())
                                produced += 1
                                if produced >= max_out:
                                    return out

    if len(groups) >= 4 and max_combo_size >= 4:
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                for k in range(j + 1, len(groups)):
                    for m in range(k + 1, len(groups)):
                        for a in groups[i]:
                            for b in groups[j]:
                                for c in groups[k]:
                                    for d in groups[m]:
                                        out.append(f"{a} {b} {c} {d}".strip())
                                        produced += 1
                                        if produced >= max_out:
                                            return out

    if len(groups) >= 5 and max_combo_size >= 5:
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                for k in range(j + 1, len(groups)):
                    for m in range(k + 1, len(groups)):
                        for n in range(m + 1, len(groups)):
                            for a in groups[i]:
                                for b in groups[j]:
                                    for c in groups[k]:
                                        for d in groups[m]:
                                            for e in groups[n]:
                                                out.append(f"{a} {b} {c} {d} {e}".strip())
                                                produced += 1
                                                if produced >= max_out:
                                                    return out

    return out


def _seed_repos(seed: List[str]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for full in seed or []:
        s = (full or "").strip()
        if "/" not in s:
            continue
        owner, repo = s.split("/", 1)
        out.append(
            {
                "type": "repo",
                "owner": owner,
                "repo": repo,
                "full_name": s,
                "html_url": f"https://github.com/{s}",
                "matched_keyword": "seed",
                "seed": True,
            }
        )
    return out


def _enrich_repo(gh: GithubClient, base: Dict[str, Any], config: ScannerConfig) -> Dict[str, Any]:
    owner = base.get("owner") or ""
    repo = base.get("repo") or ""
    if not owner or not repo:
        full = base.get("full_name") or ""
        if "/" in full:
            owner, repo = full.split("/", 1)
    info: Dict[str, Any] = {}
    readme = ""
    try:
        info = gh.get_repo(owner, repo)
    except Exception:
        info = {}
    try:
        readme = gh.get_readme_text(owner, repo)
    except Exception:
        readme = ""
    topics = info.get("topics") if isinstance(info, dict) else None
    if not isinstance(topics, list):
        topics = []
    meta = {
        "full_name": info.get("full_name") or base.get("full_name") or f"{owner}/{repo}",
        "description": info.get("description") or base.get("description") or "",
        "topics": topics,
        "language": info.get("language") or base.get("language") or "",
        "matched_keyword": base.get("matched_keyword") or "",
        "stars": int(info.get("stargazers_count") or base.get("stargazers_count") or 0),
        "updated_at": info.get("updated_at") or base.get("updated_at") or "",
        "license": ((info.get("license") or {}) if isinstance(info.get("license"), dict) else {}).get("spdx_id") or "",
    }
    analysis = analyze_repo_text(
        text=readme,
        meta=meta,
        llm=config.llm,
    )
    return {
        **base,
        "owner": owner,
        "repo": repo,
        "full_name": meta["full_name"],
        "html_url": info.get("html_url") or base.get("html_url") or f"https://github.com/{owner}/{repo}",
        "stars": meta["stars"],
        "updated_at": meta["updated_at"],
        "topics": topics,
        "license": meta["license"],
        "analysis": analysis,
    }


def _enrich_skill(gh: GithubClient, base: Dict[str, Any], config: ScannerConfig) -> Dict[str, Any]:
    owner = base.get("owner") or ""
    repo = base.get("repo") or ""
    info: Dict[str, Any] = {}
    try:
        info = gh.get_repo(owner, repo)
    except Exception:
        info = {}
    topics = info.get("topics") if isinstance(info, dict) else None
    if not isinstance(topics, list):
        topics = []
    skill_doc = ""
    skill_file_url = base.get("skill_file_url") or ""
    if skill_file_url:
        raw = _html_to_raw(skill_file_url)
        if raw:
            try:
                skill_doc = gh.get_text(raw)
            except Exception:
                skill_doc = ""
    readme = ""
    try:
        readme = gh.get_readme_text(owner, repo)
    except Exception:
        readme = ""
    meta = {
        "full_name": info.get("full_name") or f"{owner}/{repo}",
        "description": info.get("description") or "",
        "topics": topics,
        "skill_name": base.get("skill_name") or "",
        "matched_keyword": base.get("matched_keyword") or "",
        "stars": int(info.get("stargazers_count") or 0),
        "updated_at": info.get("updated_at") or "",
    }
    analysis_text = "\n\n".join([x for x in [skill_doc, readme] if x]).strip()
    analysis = analyze_repo_text(text=analysis_text, meta=meta, llm=config.llm)
    return {
        **base,
        "html_url": info.get("html_url") or f"https://github.com/{owner}/{repo}",
        "stars": meta["stars"],
        "updated_at": meta["updated_at"],
        "topics": topics,
        "analysis": analysis,
    }


def _html_to_raw(url: str) -> str:
    s = (url or "").strip()
    if not s.startswith("https://github.com/"):
        return ""
    parts = s.split("/")
    if "blob" not in parts:
        return ""
    i = parts.index("blob")
    owner = parts[3] if len(parts) > 3 else ""
    repo = parts[4] if len(parts) > 4 else ""
    ref = parts[i + 1] if len(parts) > i + 1 else "main"
    path = "/".join(parts[i + 2 :])
    if not owner or not repo or not path:
        return ""
    return f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}"


def _sort_and_dedupe(items: List[Dict[str, Any]], key) -> List[Dict[str, Any]]:
    seen = set()
    out: List[Dict[str, Any]] = []
    items_sorted = sorted(
        items,
        key=lambda x: (int(x.get("stars") or 0), x.get("updated_at") or ""),
        reverse=True,
    )
    for it in items_sorted:
        k = key(it)
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out
