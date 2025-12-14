import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 3001))
ENVIRONMENT = os.getenv("ENVIRONMENT", "DEV")

# Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL").rstrip("/") + "/rest/v1/"
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# Discord
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
DISCORD_GUILD_ID = os.getenv("DISCORD_GUILD_ID")
ADMIN_ROLE_IDS = os.getenv("ADMIN_ROLE_IDS", "").split(",")
MOD_ROLE_IDS = os.getenv("MOD_ROLE_IDS", "").split(",")

# FiveM
FIVEM_JOIN_CODE = os.getenv("FIVEM_JOIN_CODE", "")

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
