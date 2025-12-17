# CORE Website

Sito web **Core Roleplay** (FiveM) con **frontend React/Vite**, **DB web su Supabase**, e **backend Python Flask** che integra:
- Ruoli Discord (Admin/Moderator) via Discord Bot API
- Stato server FiveM (players/maxPlayers)
- Accessi/ore giocate dal DB del server FiveM (MySQL)

## Credits

- **Sviluppo Frontend + DB lato web (Supabase):** *MaDGiiRL*
- **Sviluppo Backend + DB lato FiveM:** *Swerd*

---

## Stack Tecnologico

### Frontend
- Vite 7 + React 19
- React Router DOM 7
- TailwindCSS 4
- Framer Motion
- Lucide Icons
- Supabase JS
- Three.js / React Three Fiber + Postprocessing
- SweetAlert2
- Stats.js (FPS overlay)

### Backend (API)
- Python + Flask **3.1.0**
- flask-cors **5.0.1**
- flask-socketio **5.5.1**
- eventlet **0.35.2**
- python-dotenv **1.1.0**
- requests **2.31.0**
- PyJWT **2.10.1**
- DB drivers: psycopg2-binary (Postgres) / mysql-connector-python o pymysql (MySQL)

### Database
- **Web DB:** Supabase (Postgres + REST)
- **FiveM DB:** MySQL (tabella `users` con `identifier`, `discord_id`, `last_access`, `total_minutes`)

---

## Struttura Progetto (indicativa)

```

api/
  routes/
  services/
  utils/
    app.py
    config.py
    wsgi.py
src/
  components/
    admin/
      admin-dashboard/
      background-queue/
    backgrounds/
      scroll_home/
      animated_gradient/
    connect/
    rules/
    staff/
    users/
  pages/
    admin/
    connect/
    users/
     background-form/
      ui/
     character-dashboard/
  context/   
  hooks/
  layout/
  lib/
  pages/
  routes/
  validation/

---

## Frontend — Setup

### Requisiti
- Node.js (consigliato LTS)
- npm o yarn

### Installazione
```bash
npm install
```

### Avvio in sviluppo
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

---

## Variabili d’Ambiente (Frontend)

Crea un file **`.env`** nella root del frontend:

```bash
# URL del backend Flask (es: http://localhost:5000)
VITE_API_URL=http://localhost:5000

# Supabase (se usi supabase-js client side)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

> Importante: se `VITE_API_URL` è vuoto, la fetch diventa `"/api/access"` e può generare URL errati (es. `http://localhost:5000//api/access` se metti uno slash finale).  
> Consiglio: usa **senza slash finale**, es: `http://localhost:5000`.

---

## Backend Flask — Setup

### Requisiti
- Python 3.10+ consigliato
- Virtualenv consigliato

### Installazione dipendenze
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### Avvio
Esempio:
```bash
python app.py
```


---

## API Endpoints (Backend)

### Discord Roles
Esempio logica (Discord Bot API):
- Recupera i ruoli utente dal guild member endpoint
- Valuta `isAdmin` e `isMod` in base a `ADMIN_ROLE_IDS`, `MOD_ROLE_IDS`

Output atteso:
```json
{
  "123456789": { "isAdmin": true, "isMod": false }
}
```

### FiveM Server Status
Chiama:
`https://servers-frontend.fivem.net/api/servers/single/<FIVEM_JOIN_CODE>`

Output esempio:
```json
{ "online": true, "players": 64, "maxPlayers": 128 }
```

### FiveM Server Access
Query MySQL:
```sql
SELECT identifier, discord_id, last_access, total_minutes
FROM users
```

Output esempio (usato da `useServerAccess`):
```json
[
  {
    "userId": "license:xxxx",
    "discordId": "123456789",
    "lastServerJoinAt": "2025-12-17T20:30:00",
    "hoursPlayed": 12.5
  }
]
```

### Supabase Helpers
Utility REST (select/insert/update/delete) con `requests`:
- `supabase_select(table, filters=None)`
- `supabase_insert(table, data)`
- `supabase_update(table, data, filters)`
- `supabase_delete(table, filters)`

---

## Autenticazione & Permessi (Frontend)

- Login Discord gestito da contesto `AuthContext` (session + profile).
- Rotte protette tramite `ProtectedRoute`:
  - `requireAuth`: solo loggati
  - `requireAdmin`: solo admin
  - `requireMod`: solo moderator
  - `modOnly`: solo mod **non admin**

Esempio routing:
- `/dashboard` → area utente (CharacterDashboard)
- `/background` → form invio BG
- `/admin` → AdminDashboard (admin)
- `/admin/backgrounds` → BackgroundQueue (solo mod non admin)

---

## License

Progetto privato (**private: true**). Uso interno al server Core Roleplay.
