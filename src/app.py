import os
from datetime import datetime

from flask import Flask, render_template, request, Markup

from sections import blog
from markdown import markdown

blueprints = [
    blog.bp,
]

github_repository = os.getenv('GITHUB_REPOSITORY')
if github_repository and not os.getenv('CNAME'):
    owner, sep, repo = github_repository.partition('/')
    app = Flask(__name__, static_url_path=f'/{repo}/static')
    for bp in blueprints:
        app.register_blueprint(bp, url_prefix=f'/{repo}')
else:
    app = Flask(__name__)
    for bp in blueprints:
        app.register_blueprint(bp)


@app.context_processor
def add_navigation() -> dict:
    endpoints = [(f'{bp.name}.index', bp.name.title()) for bp in blueprints]
    items = [{
        'active': request.endpoint == endpoint,
        'endpoint': endpoint,
        'title': title,
    } for endpoint, title in endpoints]

    return {
        'navigation': items,
    }


@app.context_processor
def add_last_updated() -> dict:
    """
    Returns the date when the website was updated.
    Since we are using frozen-flask, we just return datetime.now()
    """
    return {
        'PAGE_LAST_UPDATED': datetime.now().strftime('%c')
    }


@app.context_processor
def add_meta_tags() -> dict:
    return {
        'meta': {}
    }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about/')
def about():
    return render_template('about.html')


# @app.route('/impressum/')
def impressum():
    content = Markup(markdown("""
# Impressum / Legal Notice

Angaben gem. § 5 TMG: 

Vorname Nachname  
Straße Hausnr.  
PLZ Ort

E-Mail: me@example.com

    """))
    return render_template('base.html', meta={'robots': 'noindex, follow'}, raw_content=content)


if __name__ == '__main__':
    app.run()
