import requests
from config import DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, ADMIN_ROLE_IDS, MOD_ROLE_IDS

def get_user_roles(discord_id):
    url = f"https://discord.com/api/guilds/{DISCORD_GUILD_ID}/members/{discord_id}"
    headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN}"}
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        return []
    return r.json().get("roles", [])

def check_roles(discord_ids):
    results = {}
    for did in discord_ids:
        roles = get_user_roles(did)
        results[did] = {
            "isAdmin": any(r in ADMIN_ROLE_IDS for r in roles),
            "isMod": any(r in MOD_ROLE_IDS for r in roles)
        }
    return results
