"""Source-checkout entry point for the experiment runner."""

from __future__ import annotations

import sys
from pathlib import Path


def _main() -> int:
    research_root = Path(__file__).resolve().parent
    source_root = research_root / "src"
    if str(source_root) not in sys.path:
        sys.path.insert(0, str(source_root))

    from preference_intelligence_research.cli import main

    return main()


if __name__ == "__main__":
    raise SystemExit(_main())
