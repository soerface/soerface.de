import re
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime

import frontmatter
import requests
from bs4 import BeautifulSoup
from flask import (
    Blueprint,
    abort,
    current_app,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from flask_wtf import FlaskForm
from markdown import markdown
from markupsafe import Markup, escape
from slugify import slugify
from wtforms import StringField, TextAreaField, validators

import env
from iconfonts import IconFontsExtension

ARTICLE_BASE_PATH = env.DATA_PATH / "blog/articles"

bp = Blueprint("blog", __name__, url_prefix="/blog", template_folder="templates")


def open_external_links_in_new_tab(html_content, domain="soerface.de"):
    """
    Parses the given HTML content, finds all anchor tags, and adds
    target="_blank" to links pointing to a different domain.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    for a_tag in soup.find_all("a", href=True):
        href = a_tag.get("href")
        # Ensure the link is an absolute URL before parsing the domain
        if href and href.startswith(("http://", "https://")):
            parsed_url = urlparse(href)
            if parsed_url.netloc != domain:
                a_tag["target"] = "_blank"
    return str(soup)


def add_class_to_tag(text, tag, class_name):
    # TODO: poor mans replacing, add a proper html parser
    return text.replace(f"<{tag}>", f'<{tag} class="{class_name}">')


def load_article(path: Path):
    index_md = path / "index.md"
    if not index_md.exists():
        generate_example_article(path)
    article = frontmatter.load(index_md)
    date_string, _, slug = path.name.partition("_")
    article.metadata["date"] = datetime.strptime(date_string, "%Y-%m-%d")
    article.metadata["slug"] = slug
    article.metadata["href"] = url_for(
        "blog.article_detail",
        year=article.metadata["date"].year,
        month=f'{article.metadata["date"].month:02}',
        day=f'{article.metadata["date"].day:02}',
        slug=article.metadata["slug"],
    )
    article.metadata["media"] = [
        url_for(
            "blog.article_media",
            year=article.metadata["date"].year,
            month=f'{article.metadata["date"].month:02}',
            day=f'{article.metadata["date"].day:02}',
            slug=article.metadata["slug"],
            filename=x.name,
        )
        for x in path.glob("*")
    ]
    if teaser := article.metadata.get("teaser"):
        card_text = markdown(escape(teaser))
        # markdown() returns a paragraph. Paragraphs in a card should have the "card-text" class for better styling,
        # so we hack it in here
        card_text = add_class_to_tag(card_text, "p", "card-text")
        card_text = open_external_links_in_new_tab(card_text)
        article.metadata["html_teaser"] = Markup(card_text)
    # Available extensions at https://python-markdown.github.io/extensions/
    # WARNING: Markdown does not get escaped! We have more issues when escaping it, and having html inside our
    # markdown files can be quite useful...
    content = markdown(
        article.content,
        extensions=[
            "markdown.extensions.extra",
            "markdown.extensions.codehilite",
            IconFontsExtension(prefix="fa-", base="fab"),
        ],
    ).replace('class="fab amp;fa-', 'class="fab fa-')

    # Add target="_blank" to all external links
    content = open_external_links_in_new_tab(content)

    content = add_class_to_tag(content, "p", "card-text")
    # frontmatter.dump(article, path)
    return {"metadata": article.metadata, "content": Markup(content)}


def get_article_path(year, month, day, slug) -> Path:
    return ARTICLE_BASE_PATH / f"{year}-{month}-{day}_{slug}"


def load_article_list():
    paths = ARTICLE_BASE_PATH.glob("*")
    # TODO: this can throw index errors if a directory does not contain a date
    sorted_paths = sorted(
        paths, key=lambda x: re.findall(r"\d{4}-\d{2}-\d{2}", x.name)[0]
    )[::-1]
    return sorted_paths


def generate_example_article(path: Path):
    _, _, slug = path.name.partition("_")
    title = slug.replace("-", " ").capitalize()
    return generate_article(
        path,
        content="Start writing your article here. Don't forget to add it to git!",
        title=title,
        teaser=f"Open `{path}/index.md` to edit this article.",
    )


def generate_article(path: Path, content, title=None, teaser=None):
    md = render_template(
        "article_template.md",
        article={"title": title, "teaser": teaser, "content": content},
    )
    path.mkdir(parents=True, exist_ok=True)
    with open(path / "index.md", "w") as f:
        f.write(md)


def generate_title_from_content(data):
    api_key = current_app.config["OPENAI_API_KEY"]
    if not api_key:
        return "untitled"
    response = requests.post(
        "https://api.openai.com/v1/completions",
        headers={"authorization": f"Bearer {api_key}"},
        json={
            "model": "text-davinci-003",
            "prompt": "Title of this blog article: ",
            "suffix": data,
        },
    )
    data = response.json()
    return data["choices"][0]["text"].strip()


@bp.route("/", methods=["GET", "POST"])
def index():
    if current_app.config["FROZEN"]:
        form = None
    else:
        form = NewArticleForm(request.form)
        if form.validate():
            title = form.title.data
            if not title:
                title = generate_title_from_content(form.content.data)
            now = datetime.now()
            slug = slugify(title)
            path = ARTICLE_BASE_PATH / f'{now.strftime("%Y-%m-%d")}_{slug}'
            generate_article(
                path, form.content.data, title=title, teaser=form.teaser.data
            )
            return redirect(
                url_for(
                    "blog.article_detail",
                    year=now.year,
                    month=f"{now.month:02}",
                    day=f"{now.day:02}",
                    slug=slug,
                )
            )
    articles = [load_article(x) for x in load_article_list()]
    description = "Occasionally sharing things I learned"
    return render_template(
        "blog/index.html",
        article_list=articles,
        page_title="Blog",
        meta={
            "description": description,
        },
        meta_properties={
            "og:description": description,
            "og:title": "soerface' Blog",
            "og:image": url_for("static", filename="img/profile_photo.jpg"),
        },
        form=form,
    )


@bp.route("/<year>/<month>/<day>/<string:slug>/")
def article_detail(year, month, day, slug):
    path = get_article_path(year, month, day, slug)
    article = load_article(path)
    title = article["metadata"].get("title")
    teaser = article["metadata"].get("teaser")
    if teaser and teaser[-1] == "\n":
        teaser = teaser[:-1]
    image_url = article["metadata"].get(
        "image", url_for("static", filename="img/profile_photo.jpg")
    )
    return render_template(
        "blog/article_detail.html",
        article=article,
        page_title=title,
        meta={
            "description": teaser,
        },
        meta_properties={
            "og:description": teaser,
            "og:title": title,
            "og:image": image_url,
        },
    )


@bp.route("/<year>/<month>/<day>/<string:slug>/<path:filename>")
def article_media(year, month, day, slug, filename):
    path = get_article_path(year, month, day, slug)
    try:
        return send_file(path / filename)
    except FileNotFoundError:
        abort(404)


class NewArticleForm(FlaskForm):
    title = StringField("Title")
    teaser = TextAreaField("Teaser")
    content = TextAreaField("Content", validators=[validators.DataRequired()])
    # Thought about explicitly marking short articles, but going for "just leave out the teaser" for now
    # short_article = BooleanField("Short article", default=True, render_kw={"checked": ""})
