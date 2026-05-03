# User Page Database Setup

1. Start XAMPP Apache and MySQL.
2. Open phpMyAdmin and import `../database/db.sql`.
3. Copy `.env.example` to `.env` if your MySQL password or port is different.
4. In one terminal, run:

   ```sh
   npm run server
   ```

5. In another terminal, run:

   ```sh
   npm run dev
   ```

6. Open the Vite URL, usually `http://localhost:5175/user`.

The React page reads from `/api/...` by default, and Vite proxies those requests to `http://127.0.0.1:4001`. XAMPP's common local MySQL settings are already in `.env.example`: user `root`, empty password, database `park_guide_database`.
