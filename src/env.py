import os
from pathlib import Path

GITHUB_REPOSITORY = os.getenv('GITHUB_REPOSITORY')
CNAME = os.getenv('CNAME')
BLOG_PATH = Path(os.getenv('BLOG_PATH', 'data/blog')).absolute()
