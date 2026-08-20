# Admin/API Setup

1. Install Python 3.11+.
2. From this project folder, install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and change `SECRET_KEY`, `ADMIN_BOOTSTRAP_PASSWORD`, and SMS settings.
4. Start the API:

```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8002
```

5. Open `admin.html`.

Default local login:

- Email: `admin@example.com`
- Password: `ChangeMeNow123!`

REST docs run at `http://127.0.0.1:8002/docs`.

If you run the API on a different port, set `window.DMD_API_BASE_URL` before loading the page.

SMS behavior:

- If `SMS_API_URL` is empty, SMS requests are logged with status `skipped`.
- If `SMS_API_URL` is set, the API sends JSON: `{ "to": "...", "message": "...", "sender_id": "DMDCARE" }`.
- Set `SMS_IP_UPDATE_URL` to the gateway's IP-whitelist endpoint. The admin sends JSON: `{ "ip": "..." }` with the same bearer API key.
