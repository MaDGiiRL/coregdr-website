from flask import Flask
from flask_cors import CORS
from routes.logs import logs_bp
from routes.roles import roles_bp
from routes.server import server_bp

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(logs_bp)
app.register_blueprint(roles_bp)
app.register_blueprint(server_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
