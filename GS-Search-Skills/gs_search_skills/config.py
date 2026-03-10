import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

_ENV_PATTERN = re.compile(r"\$\{([^}]+)\}")


def _interpolate_env(value: Any) -> Any:
    if isinstance(value, str):
        def _repl(m: re.Match) -> str:
            k = (m.group(1) or "").strip()
            return os.environ.get(k, "")

        return _ENV_PATTERN.sub(_repl, value)
    if isinstance(value, list):
        return [_interpolate_env(v) for v in value]
    if isinstance(value, dict):
        return {k: _interpolate_env(v) for k, v in value.items()}
    return value


class GithubConfig(BaseModel):
    token: Optional[str] = Field(default=None)
    min_stars: int = Field(default=2000, ge=0)
    max_results: int = Field(default=20, ge=1, le=100)
    seed_repos: List[str] = Field(default_factory=lambda: ["cclank/news-aggregator-skill"])


class FeishuConfig(BaseModel):
    webhook_url: str = Field(default="")
    webhook_secret: str = Field(default="")
    app_id: str = Field(default="")
    app_secret: str = Field(default="")
    receive_id_type: str = Field(default="chat_id")
    receive_id: str = Field(default="")
    msg_type: str = Field(default="post")


class ScheduleConfig(BaseModel):
    enabled: bool = Field(default=False)
    mode: str = Field(default="interval")
    interval_minutes: int = Field(default=360, ge=1)
    daily_time: str = Field(default="09:30")
    timezone: str = Field(default="Asia/Shanghai")


class SourcesConfig(BaseModel):
    skills_ecosystem: bool = Field(default=True)
    github_repos: bool = Field(default=True)
    seed_repos: bool = Field(default=True)


class LlmConfig(BaseModel):
    enabled: bool = Field(default=False)
    base_url: str = Field(default="https://api.openai.com/v1")
    api_key: str = Field(default="")
    model: str = Field(default="gpt-4o-mini")
    timeout_s: float = Field(default=30.0, ge=1.0)


class QueryConfig(BaseModel):
    mode: str = Field(default="keywords")
    max_combo_size: int = Field(default=3, ge=1, le=5)
    max_combos_per_industry: int = Field(default=120, ge=0, le=2000)


class IndustryLangConfig(BaseModel):
    singles: List[str] = Field(default_factory=list)
    groups: List[List[str]] = Field(default_factory=list)


class IndustryConfig(BaseModel):
    name: str = Field(default="")
    cn: IndustryLangConfig = Field(default_factory=IndustryLangConfig)
    en: IndustryLangConfig = Field(default_factory=IndustryLangConfig)


class ScannerConfig(BaseModel):
    keywords_cn: List[str] = Field(default_factory=list)
    keywords_en: List[str] = Field(default_factory=list)
    github: GithubConfig = Field(default_factory=GithubConfig)
    feishu: FeishuConfig = Field(default_factory=FeishuConfig)
    schedule: ScheduleConfig = Field(default_factory=ScheduleConfig)
    sources: SourcesConfig = Field(default_factory=SourcesConfig)
    llm: LlmConfig = Field(default_factory=LlmConfig)
    query: QueryConfig = Field(default_factory=QueryConfig)
    industries: List[IndustryConfig] = Field(default_factory=list)

    def public_dict(self) -> Dict[str, Any]:
        d = self.dict()
        if "github" in d:
            d["github"]["token"] = ""
        if "feishu" in d:
            d["feishu"]["app_secret"] = ""
            d["feishu"]["webhook_secret"] = ""
            if "webhook_url" in d["feishu"]:
                d["feishu"]["webhook_url"] = ""
        if "llm" in d:
            d["llm"]["api_key"] = ""
        return d


def load_config(path: Optional[str] = None) -> ScannerConfig:
    cfg_path = Path(path or os.environ.get("GS_SEARCH_SKILLS_CONFIG", "config.yaml"))
    if not cfg_path.exists():
        json_path = cfg_path.with_suffix(".json")
        if json_path.exists():
            cfg_path = json_path
        else:
            return ScannerConfig()

    raw: Dict[str, Any] = {}
    if cfg_path.suffix.lower() in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore
        except Exception:
            raise RuntimeError("缺少 PyYAML：请安装 requirements.txt 或改用 config.json")
        raw = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    elif cfg_path.suffix.lower() == ".json":
        raw = json.loads(cfg_path.read_text(encoding="utf-8")) or {}
    else:
        raise RuntimeError("仅支持 config.yaml / config.yml / config.json")

    raw = _interpolate_env(raw)
    cfg = ScannerConfig.parse_obj(raw)

    receive_id_type = (cfg.feishu.receive_id_type or "").strip() or "chat_id"
    if not cfg.feishu.receive_id:
        env_receive = (os.environ.get("FEISHU_RECEIVE_ID") or "").strip()
        env_chat = (os.environ.get("FEISHU_CHAT_ID") or "").strip()
        if env_receive:
            cfg.feishu.receive_id = env_receive
        elif receive_id_type == "chat_id" and env_chat:
            cfg.feishu.receive_id = env_chat

    env_receive_type = (os.environ.get("FEISHU_RECEIVE_ID_TYPE") or "").strip()
    if env_receive_type and cfg.feishu.receive_id_type == "chat_id":
        cfg.feishu.receive_id_type = env_receive_type

    if not cfg.feishu.webhook_url:
        cfg.feishu.webhook_url = (os.environ.get("FEISHU_WEBHOOK_URL") or "").strip()
    if not cfg.feishu.webhook_secret:
        cfg.feishu.webhook_secret = (os.environ.get("FEISHU_WEBHOOK_SECRET") or "").strip()

    return cfg
