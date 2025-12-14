import jwt
import datetime
from config import SECRET_KEY
from functools import wraps
from flask import request, jsonify

def generate_jwt_token(user_id, hours=2):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=hours)
    payload = {"user_id": user_id, "exp": expiration}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"message": "Token mancante"}), 401
        token = auth_header.split(" ")[1]
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data["user_id"]
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token scaduto"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token non valido"}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated
