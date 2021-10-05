import json
from pathlib import Path

from flask import Blueprint, render_template, url_for, Response
import yaml
from markdown import markdown

import env

bp = Blueprint(
    "quiz",
    __name__,
    url_prefix="/quiz",
    template_folder="templates",
    static_folder="static",
)

QUIZ_DATA_PATH = env.DATA_PATH / "quiz"


def get_title_of_quiz(path: Path) -> str:
    with open(path) as f:
        data = yaml.load(f, Loader=yaml.SafeLoader)
    return data.get("title", path.name)


@bp.route("/")
def index():
    description = "Quiz for coders"
    file_names = QUIZ_DATA_PATH.glob("*.yaml")
    quiz_options = [{
        "filename": url_for("quiz.data_as_json", filename=x.stem),
        "title": get_title_of_quiz(x),
    } for x in file_names]
    return render_template(
        "quiz/index.html",
        page_title="Quiz",
        quiz_options=quiz_options,
        meta={
            "description": description,
        },
        meta_properties={
            "og:description": description,
            "og:title": "soerface' Blog",
            "og:image": url_for("static", filename="img/profile_photo.jpg")
        },
    )


@bp.route("/screen/")
def screen():
    return render_template("quiz/screen.html", page_title="Quiz Screen")


@bp.route("/data/<filename>.json")
def data_as_json(filename):
    yaml_filename = filename + ".yaml"
    with open(QUIZ_DATA_PATH / yaml_filename) as f:
        data = yaml.load(f, Loader=yaml.SafeLoader)

    # TODO: jsonschema validation

    def render_markdown(v):
        return markdown(v, extensions=[
            'markdown.extensions.extra',
            'markdown.extensions.codehilite',
        ])

    for k, category in data["categories"].items():
        for question in category["questions"]:
            question["q"] = render_markdown(question.get("q", ""))
            question["a"] = render_markdown(question.get("a", ""))

    return Response(json.dumps(data), mimetype="application/json")
