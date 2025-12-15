import requests
import pymysql
from datetime import datetime
from config import FIVEM_JOIN_CODE, DB_HOST_FIVEM, DB_DATABASE_FIVEM, DB_PASSWORD_FIVEM, DB_PORT_FIVEM, DB_USER_FIVEM

def server_status():
    try:
        r = requests.get(
            f"https://servers-frontend.fivem.net/api/servers/single/{FIVEM_JOIN_CODE}",
            timeout=5
        )
        if r.status_code != 200:
            return {"online": False}
        data = r.json()
        return {
            "online": True,
            "players": data["Data"]["clients"],
            "maxPlayers": data["Data"]["sv_maxclients"]
        }
    except Exception as e:
        print("FiveM status error:", e)
        return {"online": False}
    
def server_access():
    conn = pymysql.connect(
        host=DB_HOST_FIVEM,
        user=DB_USER_FIVEM,
        password=DB_PASSWORD_FIVEM,
        database=DB_DATABASE_FIVEM,
        port=int(DB_PORT_FIVEM),
        cursorclass=pymysql.cursors.DictCursor
    )

    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                identifier,
                discord_id,
                last_access,
                total_minutes
            FROM users
        """)
        rows = cursor.fetchall()

    conn.close()

    result = []
    for r in rows:
        result.append({
            "userId": r["identifier"],
            "discordId": r["discord_id"],
            "lastServerJoinAt": r["last_access"].isoformat() if r["last_access"] else None,
            "hoursPlayed": round((r["total_minutes"] or 0) / 60, 1),
        })

    return result
