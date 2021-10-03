import os
from pathlib import Path

GITHUB_REPOSITORY = os.getenv("GITHUB_REPOSITORY")
CNAME = os.getenv("CNAME")
DATA_PATH = (Path(__file__).parent.parent / "data").absolute()
