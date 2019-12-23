from flask import Blueprint, render_template

bp = Blueprint('blog', __name__, url_prefix='/blog', template_folder='templates')


@bp.route('/')
def index():
    return render_template('blog/index.html')
