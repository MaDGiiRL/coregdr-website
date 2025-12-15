from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_insert

logs_bp = Blueprint("logs_bp", __name__, url_prefix="/api/logs")

@logs_bp.route("", methods=["POST"])
def add_logs():
    data = request.get_json(silent=True)

    if not data or (isinstance(data, list) and len(data) == 0):
        return jsonify({"error": "Body JSON mancante"}), 400

    failed = []

    # Normalizza in lista per gestire singolo oggetto e batch uniformemente
    entries = data if isinstance(data, list) else [data]

    for entry in entries:
        plugin = entry.get("plugin")
        plugin_type = entry.get("plugin_type")
        description = entry.get("description")

        if not all([plugin, plugin_type, description]):
            print("⚠️ Entry incompleta ignorata:", entry)
            continue

        try:
            res = supabase_insert("server_logs", {
                "plugin": plugin,
                "plugin_type": plugin_type,
                "description": description
            })
        except Exception as e:
            print("🔥 Errore inserimento log Supabase:", e, "Entry:", entry)
            failed.append({"entry": entry, "error": str(e)})

    if failed:
        return jsonify({"success": False, "failed": failed}), 500

    return jsonify({"success": True, "inserted": len(entries) - len(failed)}), 201
