from pathlib import Path

from flask import Blueprint, render_template, Markup, escape, url_for
from markdown import markdown
import frontmatter
from datetime import datetime
from iconfonts import IconFontsExtension

bp = Blueprint('blog', __name__, url_prefix='/blog', template_folder='templates')


def add_class_to_tag(text, tag, class_name):
    # TODO: poor mans replacing, add a proper html parser
    return text.replace(f'<{tag}>', f'<{tag} class="{class_name}">')


def load_article(path: Path):
    article = frontmatter.load(path)
    date_string, _, slug = path.name.replace('.md', '').partition('_')
    article.metadata['date'] = datetime.strptime(date_string, '%Y-%m-%d')
    article.metadata['slug'] = slug
    article.metadata['href'] = url_for('blog.article_detail',
                                       year=article.metadata['date'].year,
                                       month=f'{article.metadata["date"].month:02}',
                                       day=f'{article.metadata["date"].day:02}',
                                       slug=article.metadata['slug']
                                       )
    card_text = markdown(escape(article.metadata.get('teaser')))
    # markdown() returns a paragraph. Paragraphs in a card should have the "card-text" class for better styling,
    # so we hack it in here
    card_text = add_class_to_tag(card_text, 'p', 'card-text')
    # Available extensions at https://python-markdown.github.io/extensions/
    # TODO: still some escaping issues, e.g. inside <pre> blocks no < or > possible...
    content = markdown(escape(article.content), extensions=[
        'markdown.extensions.extra',
        'markdown.extensions.codehilite',
        IconFontsExtension(prefix='amp;fa-', base='fab')
    ]).replace('class="fab amp;fa-', 'class="fab fa-')
    content = add_class_to_tag(content, 'p', 'card-text')
    article.metadata['teaser'] = Markup(card_text)
    # frontmatter.dump(article, path)
    return {
        'metadata': article.metadata,
        'content': Markup(content)
    }


@bp.route('/')
def index():
    paths = Path('data/blog/articles/').glob('**/*.md')
    # event_list = [re.search(r'(\d+)/(.+).yml', str(p)).groups() for p in paths]
    articles = [load_article(x) for x in paths][::-1]
    return render_template('blog/index.html', article_list=articles)


@bp.route('/<year>/<month>/<day>/<string:slug>/')
def article_detail(year, month, day, slug):
    path = Path('data/blog/articles/') / f'{year}-{month}-{day}_{slug}.md'
    article = load_article(path)
    return render_template('blog/article_detail.html', article=article)
