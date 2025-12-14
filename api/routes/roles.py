from flask import Blueprint, request, jsonify
from services.discord_service import check_roles

roles_bp = Blueprint("roles_bp", __name__, url_prefix="/api/checkroles")

@roles_bp.route("", methods=["GET"])
def roles():
    ids_param = request.args.get("ids")
    if not ids_param:
        return jsonify({"error": "Nessun ID fornito"}), 400
    discord_ids = [i.strip() for i in ids_param.split(",") if i.strip()]
    results = check_roles(discord_ids)
    return jsonify(results)
