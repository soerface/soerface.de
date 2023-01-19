from datetime import datetime

from flask import Flask, render_template, request, Markup
from flask_wtf.csrf import CSRFProtect

import env
from sections import blog, quiz
from markdown import markdown

blueprints = [
    blog.bp,
    quiz.bp,
]

if env.GITHUB_REPOSITORY and not env.CNAME:
    owner, sep, repo = env.GITHUB_REPOSITORY.partition('/')
    app = Flask(__name__, static_url_path=f'/{repo}/static')
    for bp in blueprints:
        app.register_blueprint(bp, url_prefix=f'/{repo}')
else:
    app = Flask(__name__)
    for bp in blueprints:
        app.register_blueprint(bp)
CSRFProtect(app)
app.config.from_object("settings_default")
app.config.from_object("settings")


@app.context_processor
def add_navigation() -> dict:
    endpoints = [(f'{bp.name}.index', bp.name.title()) for bp in blueprints if bp.name != "quiz"]
    items = [{
        'active': request.endpoint.partition('.')[0] == endpoint.partition('.')[0],
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
        "meta": {},
        "meta_properties": {},
    }


@app.route('/')
def index():
    return render_template('index.html')


# @app.route('/impressum/')
def impressum():
    content = Markup(markdown("""
# Impressum / Legal Notice

Angaben gem. § 5 TMG: 

Vorname Nachname  
Straße Hausnr.  
PLZ Ort

E-Mail: me@example.com

    """))  # noqa: W291
    return render_template('base.html', meta={'robots': 'noindex, follow'}, raw_content=content)


if __name__ == '__main__':
    app.run(debug=True)
