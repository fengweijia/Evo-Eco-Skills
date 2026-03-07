import os
import re
import subprocess
from typing import Any, Dict, List


_OWNER_REPO_SKILL = re.compile(r"([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)@([A-Za-z0-9_.-]+)")


def enabled() -> bool:
    return os.environ.get("GS_ENABLE_SKILLS_CLI", "").strip() in ("1", "true", "TRUE", "yes", "YES")


def find_skills_via_cli(keywords: List[str], max_results: int) -> List[Dict[str, Any]]:
    if not enabled():
        return []
    out: List[Dict[str, Any]] = []
    for kw in keywords:
        try:
            text = _run_find(kw)
        except Exception:
            continue
        for m in _OWNER_REPO_SKILL.finditer(text or ""):
            owner_repo = m.group(1)
            skill = m.group(2)
            if "/" not in owner_repo:
                continue
            owner, repo = owner_repo.split("/", 1)
            out.append(
                {
                    "type": "skill",
                    "owner": owner,
                    "repo": repo,
                    "skill_name": skill,
                    "source": "find-skills (skills cli)",
                    "matched_keyword": kw,
                    "install": f"npx skills add {owner}/{repo}@{skill}",
                    "skills_sh_url": f"https://skills.sh/{owner}/{repo}/{skill}",
                    "skill_file_url": "",
                }
            )
            if len(out) >= max_results:
                break
        if len(out) >= max_results:
            break
    return out


def _run_find(query: str) -> str:
    p = subprocess.run(
        ["npx", "-y", "skills", "find", query],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        check=False,
        timeout=60,
    )
    return p.stdout or ""

