# Admin Page

Run this app through the repository root so the Admin UI and backend share the same environment:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm run dev
```

The backend should use MySQL incident storage for the lecturer demo. Confirm:

```bash
curl -s http://localhost:4000/api/health | python3 -m json.tool
```

Expected storage values:

```text
incidents.persistence = mysql
incidents.storage.requested = mysql
incidents.storage.active = mysql
```

Do not commit real `.env` files. Use `../.env.example` as the safe template.
