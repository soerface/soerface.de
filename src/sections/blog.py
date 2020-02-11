from pathlib import Path

from flask import Blueprint, render_template, Markup, escape, url_for, send_file, abort
from markdown import markdown
import frontmatter
from datetime import datetime

import env
from iconfonts import IconFontsExtension

ARTICLE_BASE_PATH = env.BLOG_PATH / Path('articles/')

bp = Blueprint('blog', __name__, url_prefix='/blog', template_folder='templates')


def add_class_to_tag(text, tag, class_name):
    # TODO: poor mans replacing, add a proper html parser
    return text.replace(f'<{tag}>', f'<{tag} class="{class_name}">')


def load_article(path: Path):
    article = frontmatter.load(path / 'index.md')
    date_string, _, slug = path.name.partition('_')
    article.metadata['date'] = datetime.strptime(date_string, '%Y-%m-%d')
    article.metadata['slug'] = slug
    article.metadata['href'] = url_for('blog.article_detail',
                                       year=article.metadata['date'].year,
                                       month=f'{article.metadata["date"].month:02}',
                                       day=f'{article.metadata["date"].day:02}',
                                       slug=article.metadata['slug']
                                       )
    article.metadata['media'] = [
        url_for('blog.article_media',
                year=article.metadata['date'].year,
                month=f'{article.metadata["date"].month:02}',
                day=f'{article.metadata["date"].day:02}',
                slug=article.metadata['slug'],
                filename=x.name
                ) for x in path.glob('*')]
    card_text = markdown(escape(article.metadata.get('teaser')))
    # markdown() returns a paragraph. Paragraphs in a card should have the "card-text" class for better styling,
    # so we hack it in here
    card_text = add_class_to_tag(card_text, 'p', 'card-text')
    # Available extensions at https://python-markdown.github.io/extensions/
    # WARNING: Markdown does not get escaped! We have more issues when escaping it, and having html inside our
    # markdown files can be quite useful...
    content = markdown(article.content, extensions=[
        'markdown.extensions.extra',
        'markdown.extensions.codehilite',
        IconFontsExtension(prefix='fa-', base='fab')
    ]).replace('class="fab amp;fa-', 'class="fab fa-')
    content = add_class_to_tag(content, 'p', 'card-text')
    article.metadata['teaser'] = Markup(card_text)
    # frontmatter.dump(article, path)
    return {
        'metadata': article.metadata,
        'content': Markup(content)
    }


def get_article_path(year, month, day, slug) -> Path:
    return ARTICLE_BASE_PATH / f'{year}-{month}-{day}_{slug}'


@bp.route('/')
def index():
    paths = ARTICLE_BASE_PATH.glob('*')
    # event_list = [re.search(r'(\d+)/(.+).yml', str(p)).groups() for p in paths]
    articles = [load_article(x) for x in paths]
    return render_template('blog/index.html', article_list=articles)


@bp.route('/<year>/<month>/<day>/<string:slug>/')
def article_detail(year, month, day, slug):
    path = get_article_path(year, month, day, slug)
    article = load_article(path)
    return render_template('blog/article_detail.html', article=article)


@bp.route('/<year>/<month>/<day>/<string:slug>/<path:filename>')
def article_media(year, month, day, slug, filename):
    path = get_article_path(year, month, day, slug)
    try:
        return send_file(path / filename)
    except FileNotFoundError:
        abort(404)
