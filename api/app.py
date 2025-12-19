from flask import Flask
from flask_cors import CORS
from routes.logs import logs_bp
from routes.roles import roles_bp
from routes.status import status_bp
from routes.access import access_bp
from routes.pgs import pgs_bp

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(logs_bp)
app.register_blueprint(roles_bp)
app.register_blueprint(status_bp)
app.register_blueprint(access_bp)
app.register_blueprint(pgs_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
