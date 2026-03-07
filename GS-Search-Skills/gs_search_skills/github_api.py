import base64
import time
from typing import Any, Dict, Optional

import httpx


class GithubClient:
    def __init__(self, token: Optional[str] = None, timeout_s: float = 20.0):
        self._token = (token or "").strip() or None
        self._timeout_s = timeout_s

    def _headers(self) -> Dict[str, str]:
        h = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "GS-Search-Skills",
        }
        if self._token:
            h["Authorization"] = f"Bearer {self._token}"
        return h

    def get_json(self, url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        with httpx.Client(timeout=self._timeout_s, headers=self._headers()) as client:
            r = client.get(url, params=params)
            if r.status_code == 403 and "rate limit" in (r.text or "").lower():
                reset = r.headers.get("X-RateLimit-Reset")
                raise RuntimeError(f"GitHub API 触发限流。reset={reset}")
            r.raise_for_status()
            out = r.json()
            if isinstance(out, dict):
                return out
            return {"data": out}

    def get_text(self, url: str, headers: Optional[Dict[str, str]] = None) -> str:
        h = dict(self._headers())
        if headers:
            h.update(headers)
        with httpx.Client(timeout=self._timeout_s, headers=h) as client:
            r = client.get(url)
            if r.status_code == 403 and "rate limit" in (r.text or "").lower():
                reset = r.headers.get("X-RateLimit-Reset")
                raise RuntimeError(f"GitHub API 触发限流。reset={reset}")
            r.raise_for_status()
            return r.text or ""

    def search_repositories(self, q: str, per_page: int = 20, page: int = 1) -> Dict[str, Any]:
        return self.get_json(
            "https://api.github.com/search/repositories",
            params={"q": q, "per_page": per_page, "page": page},
        )

    def search_code(self, q: str, per_page: int = 20, page: int = 1) -> Dict[str, Any]:
        return self.get_json(
            "https://api.github.com/search/code",
            params={"q": q, "per_page": per_page, "page": page},
        )

    def get_repo(self, owner: str, repo: str) -> Dict[str, Any]:
        return self.get_json(f"https://api.github.com/repos/{owner}/{repo}")

    def get_topics(self, owner: str, repo: str) -> Dict[str, Any]:
        return self.get_json(
            f"https://api.github.com/repos/{owner}/{repo}/topics",
            params=None,
        )

    def get_readme_text(self, owner: str, repo: str) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        try:
            return self.get_text(url, headers={"Accept": "application/vnd.github.raw"})
        except Exception:
            data = self.get_json(url)
            content = data.get("content") or ""
            if data.get("encoding") == "base64" and content:
                try:
                    return base64.b64decode(content).decode("utf-8", errors="replace")
                except Exception:
                    return ""
            return ""

    def backoff_sleep(self, attempt: int) -> None:
        time.sleep(min(2 ** attempt, 20))

