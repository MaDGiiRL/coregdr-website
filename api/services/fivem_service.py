import requests
from config import FIVEM_JOIN_CODE

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
