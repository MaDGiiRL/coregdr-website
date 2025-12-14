from flask import Blueprint, jsonify
from services.fivem_service import server_status

server_bp = Blueprint("server_bp", __name__, url_prefix="/api/server-status")

@server_bp.route("", methods=["GET"])
def status():
    return jsonify(server_status())
