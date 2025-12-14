from functools import wraps
from flask import Flask, jsonify, redirect, request
from flask_cors import CORS
from flask_socketio import SocketIO
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
import jwt
import datetime
import json
import requests
import mysql.connector
import re
import eventlet
import eventlet.wsgi
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app, resources={r"*": {"origins": "*"}})

load_dotenv()

PORT = os.environ.get("PORT", 3001)
LOG_AUTHORIZED_PORTS = ["30120"]

DB_USER = os.environ.get("DB_USER", "postgres")
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_NAME = os.environ.get("DB_NAME", "fivelives")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "admin")
DB_PORT = os.environ.get("DB_PORT", 5432)

DB_USER_FL = os.environ.get("DB_USER_FL", "root")
DB_HOST_FL = os.environ.get("DB_HOST_FL", "localhost")
DB_NAME_FL = os.environ.get("DB_NAME_FL", "fivelives_new")
DB_PASSWORD_FL = os.environ.get("DB_PASSWORD_FL", "password")
DB_PORT_FL = os.environ.get("DB_PORT_FL", 3306)

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
DISCORD_GUILD_ID = os.getenv("DISCORD_GUILD_ID")
MOD_ROLE_IDS = os.getenv("MOD_ROLE_IDS", "").split(",")
ADMIN_ROLE_IDS = os.getenv("ADMIN_ROLE_IDS", "").split(",")

environment = os.environ.get("ENVIRONMENT")

if (environment == "PRODUCTION"):
    REDIRECT_URI = "https://fivelives.it/tablet/auth/callback"
    items_path = r"C:/Users/admin\Desktop/fivelive_duepuntozero/data/resources/[prima_di_fl_addons]/ox_inventory/data/items.lua"
    weapons_path = r"C:/Users/admin\Desktop/fivelive_duepuntozero/data/resources/[prima_di_fl_addons]/ox_inventory/data/weapons.lua"
    player_path = r"C:/Users/admin/Desktop/fivelive_duepuntozero/txData/default/data/playersDB.json"
    profilepics_folder = "../tablet/browser/assets/profilepics"
else:
    REDIRECT_URI = "http://localhost:4200/auth/callback"
    items_path = "../tablet/src/assets/items.lua"
    weapons_path = "../tablet/src/assets/weapons.lua"
    player_path = "../tablet/src/assets/playersDB.json"
    profilepics_folder = "../tablet/src/assets/profilepics"

try:
    db_pool = pool.SimpleConnectionPool(
        1, 10,
        user=DB_USER,
        host=DB_HOST,
        database=DB_NAME,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    if db_pool:
        print("Connesso a PostgreSQL")

except Exception as e:
    print("Errore di connessione al database:", e)
    
def generate_jwt_token(user_id):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token if isinstance(token, str) else token.decode('utf-8')

# --------------------------------------------------------------------------
# ENDPOINT DI LOGIN
# --------------------------------------------------------------------------   

def getDiscordId(userId):
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:            
            query = """
                SELECT discord
                FROM utenti
                WHERE id = %s
            """
            cur.execute(query, (userId, ))
            user = cur.fetchone()

            if not user:
                return None, 401
            
            return user["discord"], 200
    except Exception as e:
        return None, 500
    finally:
        db_pool.putconn(conn)

def getFivemId(userId):
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:            
            query = """
                SELECT fivem
                FROM utenti
                WHERE id = %s
            """
            cur.execute(query, (userId, ))
            user = cur.fetchone()

            if not user:
                return None, 401
            
            return user["fivem"], 200
    except Exception as e:
        return None, 500
    finally:
        db_pool.putconn(conn)

def setFivemId(userId, fivemId):
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:            
            query = """
                UPDATE utenti
                SET fivem = %s
                WHERE id = %s
            """
            cur.execute(query, (fivemId, userId, ))
            conn.commit()
            
            return jsonify({"message": "Fivem settato"}), 200
    except Exception as e:
        return None, 500
    finally:
        db_pool.putconn(conn)
        
def get_police_badge(pg_id):
    if not pg_id:
        return jsonify({"error": "Missing data"}), 400

    try:
        conn = mysql.connector.connect (
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor(dictionary=True) as cur:
            
            query = """
                SELECT metadata
                FROM users
                WHERE identifier = %s
            """
            cur.execute(query, (pg_id, ))
            row = cur.fetchone()
            badge_number = json.loads(row["metadata"])["police_badge"]
            return badge_number, 200
        
    except Exception as e:
        print("Errore nella query get_police_badge:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
def get_citizen_name(pg_id):
    if not pg_id:
        return jsonify({"error": "Missing data"}), 400

    try:
        conn = mysql.connector.connect (
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor(dictionary=True) as cur:
            
            query = """
                SELECT CONCAT(firstname, ' ', lastname) as nome
                FROM users
                WHERE identifier = %s
            """
            cur.execute(query, (pg_id, ))
            row = cur.fetchone()
            citizen_name = row["nome"]
            return citizen_name, 200
        
    except Exception as e:
        print("Errore nella query get_citizen_name:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
        
@app.route('/api/getJob/<pg_id>', methods=['GET'])
def checkIfFDO(pg_id):
    if not pg_id:
        return jsonify({"error": "Missing data"}), 400

    try:
        conn = mysql.connector.connect (
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            
            query = """
                SELECT job
                FROM users
                WHERE identifier = %s
            """
            cur.execute(query, (pg_id, ))
            row = cur.fetchone()
            return jsonify(row[0])
    except Exception as e:
        print("Errore nella query checkIfFDO:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
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
        
@app.route('/api/personaggi', methods=['GET'])
@token_required
def get_personaggi(current_user_id):
    current_user_discord = ""
    response, status = getDiscordId(current_user_id)
    if status == 200 and response:
        current_user_discord = response
    
    response, status = getFivemId(current_user_id)
    current_user_fivem = None
    if status == 200 and response:
        current_user_fivem = response
        
    else:
        
        with open(player_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            
        for player in data["players"]:
            if "discord:"+str(current_user_discord) in player.get("ids", []):
                current_user_fivem = player['license']
                setFivemId(current_user_id, current_user_fivem)
                break
    try:
        conn = mysql.connector.connect (
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            
            query = """
                SELECT identifier as id, CONCAT(firstname, ' ', lastname) as nome, job, job_grade as grade, dateofbirth
                FROM users
                WHERE SUBSTRING_INDEX(identifier, ':', -1) = %s
            """
            cur.execute(query, (current_user_fivem, ))
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = [dict(zip(columns, row)) for row in rows]

            return jsonify(result), 200
    except Exception as e:
        print("Errore nella query get_personaggi:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        conn = mysql.connector.connect (
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            query = """
                SELECT name as id, label as label
                FROM jobs
            """
            cur.execute(query)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = [dict(zip(columns, row)) for row in rows]
            return jsonify(result), 200
    except Exception as e:
        print("Error fetching jobs:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/grades', methods=['GET'])
def get_grades():
    try:
        conn = mysql.connector.connect (
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            query = """
                SELECT id as id, job_name as job, grade as grade, label as label
                FROM job_grades
            """
            cur.execute(query)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = [dict(zip(columns, row)) for row in rows]
            return jsonify(result), 200
    except Exception as e:
        print("Error fetching grades:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
@app.route('/api/badgeNumber/<string:officer_id>', methods=['GET'])
def get_badge(officer_id):
    badge_number, status = get_police_badge(officer_id)
    if (status == 200):
        return jsonify({"badge": badge_number}), 200

    else:
        return jsonify({"badge": "0000"}), 200


@app.route('/api/procura/articoli', methods=['GET'])
def get_articoli():
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT * FROM articoli ORDER BY id
            """
            cur.execute(query)
            rows = cur.fetchall()
            return jsonify(rows)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/simplearticoli', methods=['GET'])
def get_simplearticoli():
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT * FROM simplearticoli ORDER BY id
            """
            cur.execute(query)
            rows = cur.fetchall()
            return jsonify(rows)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/articoli/categorie', methods=['GET'])
def get_categorie():
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT * FROM categorie ORDER BY id
            """
            cur.execute(query)
            rows = cur.fetchall()
            return jsonify(rows)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/aziende', methods=['GET'])
def get_aziende():
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT * FROM aziende ORDER BY nome
            """
            cur.execute(query)
            rows = cur.fetchall()
            return jsonify(rows)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)


# Endpoint per ottenere tutte le settimane
@app.route('/api/procura/settimane', methods=['GET'])
def get_settimane():
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT * FROM settimane ORDER BY id DESC
            """
            cur.execute(query)
            rows = cur.fetchall()
            return jsonify(rows)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

# Endpoint per ottenere tutte le tassazioni
@app.route('/api/procura/tassazioni', methods=['GET'])
def get_tassazioni():
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT * FROM tassazioni ORDER BY id DESC
            """
            cur.execute(query)
            rows = cur.fetchall()
            return jsonify(rows)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/tassazioni/<int:azienda_id>/imposte/<int:settimana_id>', methods=['GET'])
def get_imposte(azienda_id, settimana_id):
    conn = db_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT imposte FROM tassazioni WHERE azienda = %s AND settimana = %s
            """
            cur.execute(query, (azienda_id, settimana_id))
            row = cur.fetchone()          
            return jsonify(row)
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/aziende/<int:azienda_id>/update/status/<int:settimana_id>', methods=['PUT'])
def change_status(azienda_id, settimana_id):
    conn = db_pool.getconn()
    try:
        value = request.json.get('value')

        if value is None:
            return jsonify({"message": "Valore non fornito"}), 400
    
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                UPDATE aziende
                SET stato = %s
                WHERE id = %s
            """
            cur.execute(query, (value, azienda_id))
            if value == 0:
                query = f"""
                    DELETE FROM tassazioni
                    WHERE azienda = %s AND settimana >= %s AND datariscossione IS null AND datadeposito IS null
                """
            else:
                query = f"""
                        INSERT INTO tassazioni (azienda, settimana)
                        SELECT %s, id
                        FROM settimane
                        WHERE id >= %s
                        ON CONFLICT (azienda, settimana) DO NOTHING;
                    """
            cur.execute(query, (azienda_id, settimana_id))
            conn.commit()
            return jsonify({"message": "Stato aggiornato con successo"}), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/tassazioni/<int:azienda_id>/update/value/<int:settimana_id>', methods=['PUT'])
def update_value(azienda_id, settimana_id):
    conn = db_pool.getconn()
    try:
        field = request.json.get('field')
        value = request.json.get('value')

        if field is None or value is None:
            return jsonify({"message": "Valore non fornito"}), 400

        validFields = ["cassaprecedente", "totaleuscite", "cassacorrente"]
        if field not in validFields:
            return jsonify({"message": "Campo non valido"}), 400
    
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                UPDATE tassazioni
                SET {field} = %s
                WHERE azienda = %s AND settimana = %s
            """
            cur.execute(query, (value, azienda_id, settimana_id))
            conn.commit()
            return jsonify({"message": "Campo valore aggiornato con successo"}), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/tassazioni/<int:azienda_id>/update/riscossione/<int:settimana_id>', methods=['PUT'])
def update_riscossione(azienda_id, settimana_id):
    conn = db_pool.getconn()
    try:

        checked = request.json.get('checked')
        value = request.json.get('value')

        if checked is None or value is None:
            return jsonify({"message": "Campo o valore non fornito"}), 400
    
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                UPDATE tassazioni
                SET 
                    datariscossione = CASE WHEN %s THEN CURRENT_DATE ELSE NULL END,
                    imposte = CASE WHEN %s THEN %s ELSE NULL END
                WHERE azienda = %s AND settimana = %s;
            """
            cur.execute(query, (checked, checked, value, azienda_id, settimana_id))
            conn.commit()
            return jsonify({"message": "Campo data aggiornato con successo"}), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/procura/tassazioni/<int:azienda_id>/update/deposito/<int:settimana_id>', methods=['PUT'])
def update_deposito(azienda_id, settimana_id):
    conn = db_pool.getconn()
    try:
        checked = request.json.get('checked')

        if checked is None:
            return jsonify({"message": "Campo non fornito"}), 400
    
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                UPDATE tassazioni
                SET datadeposito = CASE WHEN %s THEN CURRENT_DATE ELSE NULL END
                WHERE azienda = %s AND settimana = %s
            """
            cur.execute(query, (checked, azienda_id, settimana_id))
            conn.commit()
            return jsonify({"message": "Campo data aggiornato con successo"}), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

# --------------------------------------------------------------------------
# REPORTS
# --------------------------------------------------------------------------

@app.route('/api/reports/all', methods=['GET'])
#@token_required
def get_reports():
    
    conn2 = db_pool.getconn()
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
                
        with conn2.cursor(cursor_factory=RealDictCursor) as cur:            
            query = """
                SELECT id as report, articoli as articles
                FROM rapporti
            """
            cur.execute(query)
            rows = cur.fetchall()
            
            articoli = {
                row["report"]: row["articles"]
                for row in rows
            }
            
            query = """
                SELECT reportid, citizenid, articoli as articles
                FROM pene
            """
            cur.execute(query)
            rowspene = cur.fetchall()
            articoliPene = {}

            for row in rowspene:
                reportid = row['reportid']
                citizenid = row['citizenid']
                articles = row['articles']
                
                if reportid not in articoliPene:
                    articoliPene[reportid] = {}
                
                articoliPene[reportid][citizenid] = articles
            
        with conn.cursor() as cur:
            query = """
                SELECT 
                  o.id,
                  o.title as nome,
                  o.date as ora,
                  o.location as posizione,
                  o.author as responsabile,
                  o.description as descrizione,
                  o.implicated as criminali,
                  o.victims as vittime,
                  o.cops as agenti,
                  e.data as prove,
                  o.vehicles as veicoli                                  
                  
                FROM origen_police_reports o
                LEFT JOIN ox_inventory e ON e.name = CONCAT('evidence-', o.id)
                WHERE o.job = 'police'
                ORDER BY id DESC
            """
            cur.execute(query)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = []
            
            cur.execute("""
                SELECT reportid, citizenid, price, months, payed
                FROM origen_police_bills
            """)
            bills_rows = cur.fetchall()

            bills = {
                (reportid, citizenid): {"price": price, "months": months, "payed": bool(payed)}
                for reportid, citizenid, price, months, payed in bills_rows
            }

            for row in rows:
                row_dict = dict(zip(columns, row))

                # Parse JSON fields
                try:
                    row_dict["prove"] = [
                        {
                            "id": item["name"],
                            "amount": item["count"],
                            "image": item["metadata"].get("img") if item.get("metadata") else None,
                            "url": item["metadata"].get("imageurl") if item.get("metadata") else None
                        }
                        for item in json.loads(row_dict["prove"])
                    ]
                except Exception:
                    row_dict["prove"] = []

                try:
                    row_dict["veicoli"] = [v["plate"] for v in json.loads(row_dict["veicoli"])]
                except Exception:
                    row_dict["veicoli"] = []

                try:
                    row_dict["agenti"] = [{'id': p["citizenid"], 'nome': p["name"]} for p in json.loads(row_dict["agenti"])]
                except Exception:
                    row_dict["agenti"] = [] 

                try:
                    row_dict["criminali"] = [{'id': p["citizenid"], 'nome': p["name"]} for p in json.loads(row_dict["criminali"])]
                except Exception:
                    row_dict["criminali"] = []

                try:
                    row_dict["vittime"] = [{'id': p["citizenid"], 'nome': p["name"]} for p in json.loads(row_dict["vittime"])]
                except Exception:
                    row_dict["vittime"] = []
                    
                row_dict["nome"] = row_dict["nome"].upper()

                responsabile = row_dict.get("responsabile", "")
                row_dict["responsabile"] = responsabile
                
                row_dict["articoli"] = articoli.get(row_dict["id"])
                
                row_dict["pene"] = []
                
                for m in row_dict["criminali"]:
                    citizenid = m["id"]
                    articles = []
                    if (row_dict["id"] in articoliPene and citizenid in articoliPene[row_dict["id"]]):
                        articles = articoliPene[row_dict["id"]][citizenid]
                    pena = {
                        "citizen": citizenid,
                        "articles": articles,
                        "price": None,
                        "months": None,
                        "payed": False
                    }
                    
                    bill = bills.get((row_dict["id"], citizenid))
                    if bill:
                        pena["price"] = bill["price"]
                        pena["months"] = bill["months"]
                        pena["payed"] = bill["payed"]
                    
                    row_dict["pene"].append(pena)


                result.append(row_dict)
        
        return jsonify(result), 200

    except Exception as e:
        print("Errore nella query get_reports:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
        if conn2:
            db_pool.putconn(conn2)
            
@app.route('/api/reports/report/<int:rapporto_id>', methods=['GET'])
#@token_required
def get_report(rapporto_id):
    
    conn2 = db_pool.getconn()
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        
        with conn2.cursor(cursor_factory=RealDictCursor) as cur:
            
            query = """
                SELECT articoli as articles
                FROM rapporti
                WHERE id = %s
            """
            cur.execute(query, (rapporto_id, ))
            row = cur.fetchone()
            articoli = row['articles']
            
            query = """
                SELECT citizenid, articoli as articles
                FROM pene
                WHERE reportid = %s
            """
            cur.execute(query, (rapporto_id, ))
            rowspene = cur.fetchall()
            articoliPene = {row['citizenid']: row['articles'] for row in rowspene}
            print(articoliPene)
             
        with conn.cursor() as cur:
            query = """
                SELECT 
                  o.id,
                  o.title as nome,
                  o.date as ora,
                  o.location as posizione,
                  o.author as responsabile,
                  o.description as descrizione,
                  o.implicated as criminali,
                  o.victims as vittime,
                  o.cops as agenti,
                  e.data as prove,
                  o.vehicles as veicoli                                  
                  
                FROM origen_police_reports o
                LEFT JOIN ox_inventory e ON e.name = CONCAT('evidence-', o.id)
                WHERE o.id = %s
            """
            cur.execute(query, (rapporto_id, ))
            row = cur.fetchone()  
            columns = [desc[0] for desc in cur.description]
            
            cur.execute("""
                SELECT citizenid, price, months, payed
                FROM origen_police_bills
                WHERE reportid = %s
            """, (rapporto_id,))
            bills_rows = cur.fetchall()

            bills = {
                citizenid: {"price": price, "months": months, "payed": bool(payed)}
                for citizenid, price, months, payed in bills_rows
            }

            if (row):
                row_dict = dict(zip(columns, row))

                try:
                    row_dict["prove"] = [
                        {
                            "id": item["name"],
                            "amount": item["count"],
                            "image": item["metadata"].get("img") if item.get("metadata") else None,
                            "url": item["metadata"].get("imageurl") if item.get("metadata") else None
                        }
                        for item in json.loads(row_dict["prove"])
                    ]
                except Exception:
                    row_dict["prove"] = []

                try:
                    row_dict["veicoli"] = [v["plate"] for v in json.loads(row_dict["veicoli"])]
                except Exception:
                    row_dict["veicoli"] = []

                try:
                    row_dict["agenti"] = [{'id': p["citizenid"], 'nome': p["name"]} for p in json.loads(row_dict["agenti"])]
                except Exception:
                    row_dict["agenti"] = []

                try:
                    row_dict["criminali"] = [{'id': p["citizenid"], 'nome': p["name"]} for p in json.loads(row_dict["criminali"])]
                except Exception:
                    row_dict["criminali"] = []

                try:
                    row_dict["vittime"] = [{'id': p["citizenid"], 'nome': p["name"]} for p in json.loads(row_dict["vittime"])]
                except Exception:
                    row_dict["vittime"] = []
                    
                row_dict["nome"] = row_dict["nome"].upper()

                responsabile = row_dict.get("responsabile", "")
                row_dict["responsabile"] = responsabile
                
                row_dict["articoli"] = articoli
                row_dict["pene"] = []
                
                for m in row_dict["criminali"]:
                    citizenid = m["id"]
                    articles = []
                    if (citizenid in articoliPene):
                        articles = articoliPene[citizenid]
                    pena = {
                        "citizen": citizenid,
                        "articles": articles,
                        "price": None,
                        "months": None,
                        "payed": False
                    }
                    
                    bill = bills.get(citizenid)
                    if bill:
                        pena["price"] = bill["price"]
                        pena["months"] = bill["months"]
                        pena["payed"] = bill["payed"]
                    
                    row_dict["pene"].append(pena)

                return jsonify(row_dict), 200
            
            return jsonify(None), 200

    except Exception as e:
        print("Errore nella query get_report:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
        
        if conn2:
            db_pool.putconn(conn2)

@app.route('/api/reports/crea/<int:rapporto_id>', methods=['POST'])
@token_required
def create_rapporto(current_user_id, rapporto_id):
    try:
        conn = db_pool.getconn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                INSERT INTO rapporti (id, responsabile)
                VALUES (%s, %s)
            """
            cur.execute(query, (rapporto_id, current_user_id,))
            conn.commit()
            return jsonify({"message": "Rapporto creato con successo"}), 200
    except Exception as e:
        print("Errore nella query create_rapporto:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)
        
@app.route('/api/reports/create', methods=['POST'])
#@token_required
def create_report():
    responsabile = request.json.get('responsabile')
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            query = """
                INSERT INTO origen_police_reports (author)
                VALUES (%s)
            """
            cur.execute(query, (responsabile,))
            report_id = cur.lastrowid
            conn.commit()
            return jsonify({
                "message": "Rapporto creato con successo",
                "id": report_id
            }), 200
    except Exception as e:
        print("Errore nella query create_rapporto:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
@app.route('/api/reports/applyfee', methods=['POST'])
#@token_required
def apply_fee():
    value = request.json.get('value')
    citizenid = value['citizenid']
    title = value['title']
    concepts = value['concepts']
    job = value['job']
    author = value['author']
    reportid = value['reportid']
    price = value['price']
    months = value['months']
    articles = value['articles']
    
    conn2 = db_pool.getconn()
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )

        with conn.cursor() as cur:
            cur.execute("SELECT * FROM origen_police_reports WHERE id = %s", (reportid,))
            row = cur.fetchone()
            if not row:
                return jsonify({"success": False, "message": "Rapporto non esistente"}), 200

            cur.execute("SELECT payed FROM origen_police_bills WHERE citizenid = %s AND reportid = %s", (citizenid, reportid))
            row = cur.fetchone()

            if row:
                if row[0] == 1:
                    return jsonify({"success": False, "message": "Multa già pagata"}), 200
                else:
                    cur.execute("""
                        UPDATE origen_police_bills
                        SET title = %s, concepts = %s, job = %s, author = %s, price = %s, months = %s
                        WHERE citizenid = %s AND reportid = %s
                    """, (title, json.dumps(concepts), job, author, price, months, citizenid, reportid))
                    conn.commit()
                    
                    with conn2.cursor(cursor_factory=RealDictCursor) as cur:
                        query = """
                            INSERT INTO pene
                            VALUES (%s, %s, %s)
                            ON CONFLICT (reportid, citizenid) DO UPDATE
                            SET articoli = EXCLUDED.articoli;
                        """
                        cur.execute(query, (reportid, citizenid, articles))
                        conn2.commit()
            
                    return jsonify({"success": True, "message": "Multa aggiornata con successo"}), 200
            else:
                cur.execute("""
                    INSERT INTO origen_police_bills (citizenid, title, concepts, job, author, reportid, price, months)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (citizenid, title, json.dumps(concepts), job, author, reportid, price, months))
                conn.commit()
                
                with conn2.cursor(cursor_factory=RealDictCursor) as cur:
                    print(articles)
                    query = """
                        INSERT INTO pene
                        VALUES (%s, %s, %s)
                        ON CONFLICT (reportid, citizenid) DO UPDATE
                        SET articoli = EXCLUDED.articoli;
                    """
                    cur.execute(query, (reportid, citizenid, articles))
                    conn2.commit()
                return jsonify({"success": True, "message": "Multa creata con successo"}), 200

    except Exception as e:
        print("Errore nella query apply_fee:", e)
        return jsonify({"success": False, "message": "Errore del server"}), 500

    finally:
        if conn and conn.is_connected():
            conn.close()
            
        if conn2:
            db_pool.putconn(conn2)


@app.route('/api/reports/save', methods=['POST'])
#@token_required
def save_report():
    
    conn2 = db_pool.getconn()
    
    value = request.json.get('value')
    for i in range(len(value['agenti'])):
        pg_id = value['agenti'][i]['id']
        pg_name = value['agenti'][i]['nome']
        value['agenti'][i] = {'citizenid': pg_id, 'name': pg_name}
    
    for i in range(len(value['criminali'])):
        pg_id = value['criminali'][i]['id']
        pg_name = value['criminali'][i]['nome']
        value['criminali'][i] = {'citizenid': pg_id, 'name': pg_name}
        
    for i in range(len(value['vittime'])):
            pg_id = value['vittime'][i]['id']
            pg_name = value['vittime'][i]['nome']
            value['vittime'][i] = {'citizenid': pg_id, 'name': pg_name}
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        
        with conn.cursor() as cur:
            query = """
                UPDATE origen_police_reports
                SET title = %s, location = %s, description = %s, implicated = %s, victims = %s, cops = %s                             
                WHERE id = %s
            """
            cur.execute(query, (value['nome'], value['posizione'], value['descrizione'], json.dumps(value['criminali']), json.dumps(value['vittime']), json.dumps(value['agenti']), value['id'] ))
        
        with conn2.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                INSERT INTO rapporti
                VALUES (%s, %s)
                ON CONFLICT (id) DO UPDATE
                SET articoli = EXCLUDED.articoli;
            """
            cur.execute(query, ( value['id'], value['articoli']))
        
        conn.commit()
        conn2.commit()
            
        return jsonify({"message": "Rapporto salvato con successo"}), 200

    except Exception as e:
        print("Errore nella query save_report:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
    finally:
        if conn and conn.is_connected():
            conn.close()
        
        if conn2:
            db_pool.putconn(conn2)
            
@app.route('/api/reports/delete', methods=['POST'])
#@token_required
def delete_report():
    value = request.json.get('value')
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        
        with conn.cursor() as cur:
            query = """
                DELETE FROM origen_police_reports                       
                WHERE id = %s
            """
            cur.execute(query, (value, ))
            
        conn2 = db_pool.getconn()
        
        with conn2.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                DELETE FROM pene
                WHERE reportid = %s;
                
                DELETE FROM rapporti
                WHERE id = %s;
            """
            cur.execute(query, ( value, value))
        
        conn.commit()
        conn2.commit()
        
        return jsonify({"message": "Rapporto eliminato con successo"}), 200

    except Exception as e:
        print("Errore nella query delete_report:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
    

@app.route('/api/reports/agenti', methods=['GET'])
#@token_required
def get_agenti():
    """
    Restituisce la lista degli utenti che hanno job in ('police','sceriffi','doj').
    """
    try:
        # 2) Connessione al DB MySQL di FiveM
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            query = """
                SELECT 
                  identifier as id,
                  CONCAT(firstname, ' ', lastname) as nome,
                  job, job_grade as grade
                FROM users
                WHERE job IN ('police', 'sceriffi', 'doj')
            """
            cur.execute(query)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = [dict(zip(columns, row)) for row in rows]

            return jsonify(result), 200

    except Exception as e:
        print("Errore nella query get_agenti:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
@app.route('/api/reports/citizens', methods=['GET'])
#@token_required
def get_citizens():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            query = """
                SELECT 
                  identifier as id,
                  CONCAT(firstname, ' ', lastname) as nome,
                  job, job_grade as grade, dateofbirth
                FROM users
                WHERE identifier LIKE 'char%'
            """
            cur.execute(query)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = [dict(zip(columns, row)) for row in rows]

            return jsonify(result), 200

    except Exception as e:
        print("Errore nella query get_citizens:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
@app.route('/api/citizens/items', methods=['GET'])
#@token_required
def get_items():
    try:
        with open(items_path, "r", encoding="utf-8") as file:
            content = file.read()

        pattern = re.compile(r"\[\s*'(?P<id>[^']+)'\s*\]\s*=\s*{([^}]+)}", re.DOTALL)
        matches = pattern.finditer(content)

        items = []

        for match in matches:
            item_id = match.group('id')
            body = match.group(2)

            label_match = re.search(r"label\s*=\s*'([^']+)'", body)
            if label_match:
                label = label_match.group(1)
                items.append({'id': item_id, 'nome': label})
                
        with open(weapons_path, 'r', encoding='utf-8') as file:
            content = file.read()

        pattern = re.compile(r"\[\s*'(?P<id>[^']+)'\s*\]\s*=\s*{([^{}]*({[^{}]*})*[^{}]*)}", re.DOTALL)
        matches = pattern.finditer(content)

        for match in matches:
            item_id = match.group('id')
            body = match.group(2)
            
            label_match = re.search(r"label\s*=\s*'([^']+)'", body)
            if label_match:
                label = label_match.group(1)
                items.append({'id': item_id, 'nome': label})

        return jsonify(items), 200

    except Exception as e:
        print("Errore nella query get_items:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    
@app.route('/api/citizens/inventories', methods=['GET'])
#@token_required
def get_inventories():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    response, status = getFivemId(user_id)
    fivem_id = None
    if status == 200 and response:
        fivem_id = response
    if not fivem_id:
        return jsonify({"error": "User not found"}), 404
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        
        with conn.cursor() as cur:
            query = """
                SELECT identifier as id, inventory FROM users                   
                WHERE SUBSTRING_INDEX(identifier, ':', -1) = %s
            """
            cur.execute(query, (fivem_id, ))
            print(fivem_id)
            rows = cur.fetchall()
            
            if not rows:
                return jsonify({"error": "PG non trovato"}), 404
            
            result = []

            for row in rows:
                row_dict = {
                    "id": row[0],
                    "inventory": []
                }

                try:
                    inventory_items = json.loads(row[1])
                    row_dict["inventory"] = [
                        {
                            "id": item["name"],
                            "amount": item["count"],
                            "image": item["metadata"].get("img") if item.get("metadata") else None,
                            "url": item["metadata"].get("imageurl") if item.get("metadata") else None
                        }
                        for item in inventory_items
                    ]
                except Exception:
                    row_dict["inventory"] = []
                
                result.append(row_dict)
            
            return jsonify(result), 200

    except Exception as e:
        print("Errore nella query get_inventory:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
@app.route('/api/citizens/vehicles', methods=['GET'])
#@token_required
def get_vehicles():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST_FL,
            user=DB_USER_FL,
            database=DB_NAME_FL,
            password=DB_PASSWORD_FL,
            port=DB_PORT_FL,
            ssl_disabled=True,
            collation='utf8mb4_general_ci'
        )
        with conn.cursor() as cur:
            query = """
                SELECT
                plate as targa,
                nickname as nome,
                vehicle
                FROM owned_vehicles
            """
            cur.execute(query)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            result = []
            for row in rows:
                record = dict(zip(columns, row))
                vehicle_data = record.pop("vehicle", None)  # rimuove 'vehicle' dal record

                modello = None
                if vehicle_data:
                    try:
                        vehicle_dict = json.loads(vehicle_data) if isinstance(vehicle_data, str) else vehicle_data
                        modello = vehicle_dict.get("model")
                    except json.JSONDecodeError:
                        pass

                record["modello"] = modello
                result.append(record)

            return jsonify(result), 200

    except Exception as e:
        print("Errore nella query get_vehicles:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
            
            
@app.route('/api/logs/<plugin>', methods=['POST'])
def get_logs(plugin):
    ip = request.remote_addr
    port = request.environ.get('REMOTE_PORT')
    
    if not ((ip == "0.0.0.0" and port in LOG_AUTHORIZED_PORTS)):
       return jsonify({"error": "Accesso non autorizzato"}), 403

    conn = db_pool.getconn()
        
    try:
        data = request.get_json(force=True, silent=True) 
        
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
        
        if 'avatar_url' not in data:
            data['avatar_url'] = None
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                INSERT INTO logs (plugin, avatar_url, embeds, username)
                VALUES (%s, %s, %s, %s)
            """
            cur.execute(query, (plugin, data['avatar_url'], json.dumps(data['embeds'][0]), data['username'] if 'username' in data else None))
            conn.commit()
            
            return jsonify({"success": "Log successfully inserted"}), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)
        
@app.route('/api/logs/<plugin>/<type>', methods=['POST'])
#@token_required
def get_logs_plugin_type(plugin, type):
    ip = request.remote_addr
    port = request.environ.get('REMOTE_PORT')
    
    if not ((ip == "0.0.0.0" and port in LOG_AUTHORIZED_PORTS)):
       return jsonify({"error": "Accesso non autorizzato"}), 403
    
    conn = db_pool.getconn()
        
    try:
        
        data = request.get_json(force=True, silent=True) 
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                INSERT INTO logs (plugin, embeds, username, type)
                VALUES (%s, %s, %s, %s)
            """
            cur.execute(query, (plugin, json.dumps(data['embeds'][0]), data['username'] if 'username' in data else None, type))
            conn.commit()
            
            return jsonify({"success": "Log successfully inserted"}), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)

@app.route('/api/logs/allLogs', methods=['GET'])
#@token_required
def get_all_logs():    
    conn = db_pool.getconn()
        
    try:        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT 
                    id, 
                    CASE 
                        WHEN type IS NULL THEN plugin 
                        ELSE CONCAT(CONCAT(plugin,' - '), type) 
                    END AS plugin, 
                    avatar_url, 
                    embeds, 
                    username, 
                    type, 
                    date
                FROM logs
                ORDER BY date DESC;
            """
            cur.execute(query)
            rows = cur.fetchall()
            
            return jsonify(rows), 200
        
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        db_pool.putconn(conn)
        
# --------------------------------------------------------------------------
# DISCORD BOT
# --------------------------------------------------------------------------

def get_user_roles(discord_id):
    url = f"https://discord.com/api/guilds/{DISCORD_GUILD_ID}/members/{discord_id}"
    headers = {
        "Authorization": f"Bot {DISCORD_BOT_TOKEN}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return []  # Utente non trovato o errore
    data = response.json()
    return data.get("roles", [])

@app.route("/api/checkroles", methods=["GET"])
def check_roles():
    ids_param = request.args.get("ids")
    if not ids_param:
        return jsonify({"error": "Nessun ID fornito"}), 400

    discord_ids = [i.strip() for i in ids_param.split(",") if i.strip()]
    results = {}

    for discord_id in discord_ids:
        try:
            roles = get_user_roles(discord_id)
            results[discord_id] = {
                "isAdmin": any(r in ADMIN_ROLE_IDS for r in roles),
                "isMod": any(r in MOD_ROLE_IDS for r in roles),
            }
        except Exception as e:
            print(f"Errore ruolo {discord_id}:", e)
            results[discord_id] = {"isAdmin": False, "isMod": False}

    return jsonify(results)

# --------------------------------------------------------------------------
# SOCKET
# --------------------------------------------------------------------------

@socketio.on('connect')
def handle_connect():
    print("Client connesso!")

@socketio.on('message')
def handle_message(data):
    sender_sid = request.sid
    socketio.emit('answer', data, include_self=False)
    
@app.errorhandler(Exception)
def handle_exception(e):
    # Log dell'errore
    app.logger.error(f"Errore imprevisto: {str(e)}", exc_info=True)
    return {"error": "Si è verificato un errore interno."}, 500

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(PORT), debug=True)
