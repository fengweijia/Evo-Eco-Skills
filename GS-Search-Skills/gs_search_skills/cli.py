import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from gs_search_skills.config import load_config
from gs_search_skills.push import push_result_to_feishu
from gs_search_skills.scan import run_scan
from gs_search_skills.scheduler import schedule_forever


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(prog="gs-search-skills")
    p.add_argument("--config", default=None, help="配置文件路径（默认 ./config.yaml）")
    sub = p.add_subparsers(dest="cmd", required=True)

    run_p = sub.add_parser("run", help="执行一次扫描")
    run_p.add_argument("--push", action="store_true", help="执行后推送到飞书")
    run_p.add_argument("--output", default=None, help="将结果写入 JSON 文件")
    run_p.add_argument("--keyword", action="append", default=[], help="临时追加关键词（可多次）")

    sch_p = sub.add_parser("schedule", help="按配置定时执行并推送")

    args = p.parse_args(argv)
    cfg = load_config(args.config)

    if args.cmd == "run":
        overrides: Dict[str, Any] = {}
        if args.keyword:
            overrides["keywords"] = args.keyword
        result = run_scan(cfg, overrides=overrides)
        txt = json.dumps(result, ensure_ascii=False, indent=2)
        if args.output:
            Path(args.output).write_text(txt, encoding="utf-8")
        else:
            sys.stdout.write(txt + "\n")
        if args.push:
            push_result_to_feishu(result, cfg)
        return 0

    if args.cmd == "schedule":
        import asyncio

        asyncio.run(schedule_forever(cfg))
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())

