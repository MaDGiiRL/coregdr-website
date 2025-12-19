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
                last_seen,
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
            "lastServerJoinAt": r["last_seen"].isoformat() if r["last_seen"] else None,
            "hoursPlayed": round((r["total_minutes"] or 0) / 60, 1),
        })

    return result

def server_pgs():
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
                u.identifier,
                u.discord_id,
                u.firstname,
                u.lastname,
                j.label AS job_label,
                g.label AS job_grade_label,
                j2.label AS job2_label,
                g2.label AS job2_grade_label,
                u.last_seen,
                u.total_minutes
            FROM users u
            JOIN jobs j ON u.job = j.name
            JOIN job_grades g ON u.job = g.job_name AND u.job_grade = g.grade
            JOIN jobs j2 ON u.job2 = j2.name
            JOIN job_grades g2 ON u.job2 = g2.job_name AND u.job2_grade = g2.grade
            WHERE discord_id IS NOT NULL
        """)
        rows = cursor.fetchall()

    conn.close()

    grouped = {}

    for r in rows:
        discord_id = r["discord_id"]

        if discord_id not in grouped:
            grouped[discord_id] = []

        grouped[discord_id].append({
            "identifier": r["identifier"],
            "firstname": r["firstname"],
            "lastname": r["lastname"],
            "job": r["job_label"],
            "jobGrade": r["job_grade_label"],
            "job2": r["job2_label"],
            "job2Grade": r["job2_grade_label"],
            "lastServerJoinAt": r["last_seen"].isoformat() if r["last_seen"] else None,
            "hoursPlayed": round((r["total_minutes"] or 0) / 60, 1),
        })

    result = [
        {
            "discord_id": discord_id,
            "data": data_list
        }
        for discord_id, data_list in grouped.items()
    ]

    return result
