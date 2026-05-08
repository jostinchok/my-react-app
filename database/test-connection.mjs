import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(new URL('../user_page/package.json', import.meta.url));
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'park_guide_database',
  port: Number(process.env.DB_PORT || 3306),
});
try {
  const [roles] = await pool.query('SELECT role_name FROM roles');
  const [users] = await pool.query('SELECT name, email FROM users LIMIT 5');
  const [mods] = await pool.query('SELECT title FROM training_modules LIMIT 3');
  console.log('DB connected');
  console.log('  roles:', roles.map(r => r.role_name).join(', '));
  console.log('  users:', users.map(u => u.email).join(', '));
  console.log('  modules:', mods.map(m => m.title).join(' | '));
} finally {
  await pool.end();
}
