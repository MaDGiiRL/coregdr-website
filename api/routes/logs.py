from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_insert

logs_bp = Blueprint("logs_bp", __name__, url_prefix="/api/logs")

@logs_bp.route("", methods=["POST"])
def add_logs():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Body JSON mancante"}), 400

    plugin = data.get("plugin")
    plugin_type = data.get("plugin_type")
    description = data.get("description")
    if not all([plugin, plugin_type, description]):
        return jsonify({"error": "Campi mancanti"}), 400

    res = supabase_insert("server_logs", {
        "plugin": plugin,
        "plugin_type": plugin_type,
        "description": description
    })

    if not res:
        return jsonify({"error": "Insert fallito"}), 500
    return jsonify({"success": True, "data": res}), 201
