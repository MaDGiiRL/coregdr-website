import requests
from config import SUPABASE_URL, SUPABASE_HEADERS

def supabase_select(table, filters=None):
    url = f"{SUPABASE_URL}{table}"
    try:
        r = requests.get(url, headers=SUPABASE_HEADERS, params=filters)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Supabase select error:", e)
        return None

def supabase_insert(table, data):
    url = f"{SUPABASE_URL}{table}"
    try:
        r = requests.post(url, headers=SUPABASE_HEADERS, json=data)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Supabase insert error:", e)
        return None

def supabase_update(table, data, filters):
    url = f"{SUPABASE_URL}{table}"
    try:
        r = requests.patch(url, headers=SUPABASE_HEADERS, params=filters, json=data)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Supabase update error:", e)
        return None

def supabase_delete(table, filters):
    url = f"{SUPABASE_URL}{table}"
    try:
        r = requests.delete(url, headers=SUPABASE_HEADERS, params=filters)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Supabase delete error:", e)
        return None
