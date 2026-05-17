from flask import (
    Blueprint,
    render_template,
    render_template_string,
    send_from_directory,
    url_for,
    abort,
)
import env

bp = Blueprint(
    "tools",
    __name__,
    url_prefix="/tools",
    template_folder="templates",
    static_folder="static",
)

tools = [
    {
        "name": dirname.name,
        "path": str(dirname.relative_to(env.DATA_PATH / "tools")),
    }
    for dirname in (env.DATA_PATH / "tools").iterdir()
    if dirname.is_dir()
]


@bp.route("/")
def index():
    for tool in tools:
        for path in (env.DATA_PATH / "tools" / tool["path"]).rglob("*"):
            if path.is_file() and path.name != "index.html":
                rel_path = path.relative_to(env.DATA_PATH / "tools" / tool["path"])
                # Generate a URL for every file. This helps frozen flask to find all files.
                url_for(f"tools.{tool['path']}_static", filename=rel_path)

    return render_template("tools/index.html", page_title="Tools", tools=tools)


def serve_tool(base_path):
    index_path = env.DATA_PATH / "tools" / base_path / "index.html"
    if not index_path.exists():
        abort(404)
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    return render_template_string(content, page_title=base_path)


def serve_tool_static(base_path, filename):
    return send_from_directory(f"data/tools/{base_path}", filename)


for tool in tools:
    bp.add_url_rule(
        f"/{tool['name']}/",
        tool["path"],
        serve_tool,
        defaults={"base_path": tool["path"]},
    )
    bp.add_url_rule(
        f"/{tool['name']}/<path:filename>",
        f"{tool['path']}_static",
        serve_tool_static,
        defaults={"base_path": tool["path"]},
    )
