from flask import Blueprint, render_template

bp = Blueprint(
    "tools",
    __name__,
    url_prefix="/tools",
    template_folder="templates",
    static_folder="static",
)


@bp.route("/")
def index():
    return render_template("tools/index.html")
