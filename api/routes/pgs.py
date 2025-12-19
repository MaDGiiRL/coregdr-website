from flask import Blueprint, jsonify
from services.fivem_service import server_pgs

pgs_bp = Blueprint("pgs_bp", __name__, url_prefix="/api/pgs")

@pgs_bp.route("", methods=["GET"])
def pgs():
    return jsonify(server_pgs())
