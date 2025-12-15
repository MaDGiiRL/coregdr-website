from flask import Blueprint, jsonify
from services.fivem_service import server_access

access_bp = Blueprint("access_bp", __name__, url_prefix="/api/access")

@access_bp.route("", methods=["GET"])
def access():
    return jsonify(server_access())
