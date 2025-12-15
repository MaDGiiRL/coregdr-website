from flask import Blueprint, jsonify
from services.fivem_service import server_status

status_bp = Blueprint("status_bp", __name__, url_prefix="/api/status")

@status_bp.route("", methods=["GET"])
def status():
    return jsonify(server_status())
