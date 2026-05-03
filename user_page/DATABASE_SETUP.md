# User Page Database Setup

1. Start XAMPP Apache and MySQL.
2. Open phpMyAdmin and import `../user_login/server/db.sql`.
3. Put all real local settings in `../user_login/server/.env`. `user_page` does not need its own `.env`.
4. From the project root, install dependencies:

   ```sh
   npm install
   ```

5. From the project root, start the workspace:

   ```sh
   npm run dev
   ```

6. Open the Vite URL, usually `http://localhost:5175/user`.

The React page reads from `/api/...` by default, and Vite proxies those requests to `API_HOST:API_PORT` from `user_login/server/.env`. The default setup keeps the `user_login` backend on `4000` and the `user_page` API on `4001`.
