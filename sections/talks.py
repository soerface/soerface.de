from datetime import datetime

from flask import Blueprint, render_template, send_from_directory, url_for
import env

bp = Blueprint(
    "talks",
    __name__,
    url_prefix="/talks",
    template_folder="templates",
    static_folder="static",
)

talks = [
    {
        "name": dirname.name.partition("_")[2],
        "path": str(dirname.relative_to(env.DATA_PATH / "talks")),
        "date": datetime.strptime(dirname.name.partition("_")[0], "%Y-%m-%d"),
    } for dirname in (env.DATA_PATH / "talks").iterdir() if dirname.is_dir()
]


@bp.route("/")
def index():
    for talk in talks:
        for path in (env.DATA_PATH / "talks" / talk["path"]).rglob("*"):
            if path.is_file():
                rel_path = path.relative_to(env.DATA_PATH / "talks" / talk["path"])
                # Generate a URL for every file. This helps frozen flask to find all files.
                url_for(f"talks.{talk['path']}_static", filename=rel_path)

    return render_template("talks/index.html", page_title="Talks", talks=talks)


def serve(base_path, filename):
    return send_from_directory(f"data/talks/{base_path}", filename)


for talk in talks:
    bp.add_url_rule(
        f"/{talk['date'].strftime('%Y/%m/%d')}/{talk['name']}/",
        talk["path"],
        serve,
        defaults={"base_path": talk["path"], "filename": "index.html"},
    )
    bp.add_url_rule(
        f"/{talk['date'].strftime('%Y/%m/%d')}/{talk['name']}/<path:filename>",
        f"{talk['path']}_static",
        serve,
        defaults={"base_path": talk["path"]},
    )
