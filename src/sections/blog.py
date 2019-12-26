from pathlib import Path

from flask import Blueprint, render_template, Markup
from markdown import markdown
import frontmatter
from datetime import datetime

bp = Blueprint('blog', __name__, url_prefix='/blog', template_folder='templates')


def load_article(path: Path):
    article = frontmatter.load(path)
    date_string = path.name.partition('_')[0]
    article.metadata['date'] = datetime.strptime(date_string, '%Y-%m-%d')
    # frontmatter.dump(article, path)
    return {
        'metadata': article.metadata,
        'content': Markup(markdown(article.content))
    }


@bp.route('/')
def index():
    paths = Path('data/blog/articles/').glob('**/*.md')
    # event_list = [re.search(r'(\d+)/(.+).yml', str(p)).groups() for p in paths]
    articles = [load_article(x) for x in paths]
    return render_template('blog/index.html', article_list=articles)
