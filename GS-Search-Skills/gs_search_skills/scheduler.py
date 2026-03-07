import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from gs_search_skills.config import ScannerConfig
from gs_search_skills.push import push_result_to_feishu
from gs_search_skills.scan import run_scan


@dataclass
class RunOutcome:
    ok: bool
    error: str = ""


async def schedule_forever(config: ScannerConfig) -> None:
    if not config.schedule.enabled:
        return
    mode = (config.schedule.mode or "interval").strip().lower()
    first = True
    while True:
        try:
            if mode == "daily":
                await _sleep_until_next_daily(config)
            else:
                if not first:
                    await asyncio.sleep(int(config.schedule.interval_minutes) * 60)
            _run_and_push(config)
            first = False
        except asyncio.CancelledError:
            raise
        except Exception:
            await asyncio.sleep(10)


def _run_and_push(config: ScannerConfig) -> RunOutcome:
    try:
        result = run_scan(config)
        push_result_to_feishu(result, config)
        return RunOutcome(ok=True)
    except Exception as e:
        return RunOutcome(ok=False, error=str(e))


async def _sleep_until_next_daily(config: ScannerConfig) -> None:
    tz_name = (config.schedule.timezone or "Asia/Shanghai").strip() or "Asia/Shanghai"
    tz = ZoneInfo(tz_name)
    now = datetime.now(tz)
    hh, mm = _parse_hhmm(config.schedule.daily_time)
    target = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    if target <= now:
        target = target + timedelta(days=1)
    delta = (target - now).total_seconds()
    await asyncio.sleep(max(1, int(delta)))


def _parse_hhmm(s: str) -> tuple[int, int]:
    t = (s or "").strip()
    if ":" not in t:
        return 9, 30
    a, b = t.split(":", 1)
    try:
        hh = max(0, min(23, int(a)))
        mm = max(0, min(59, int(b)))
        return hh, mm
    except Exception:
        return 9, 30
