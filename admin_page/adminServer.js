import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'park_guide_database',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})


app.get("/api/parks", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT park_id, park_name FROM parks");
    res.json(rows);
  } catch (error) {
    console.error("Query parks error:", error);
    res.status(500).json({ error: "Database query failed." });
    console.log("parkId:", req.query.parkId);
  }
});

app.get('/api/admin/badges', async (req, res) => {
  try {
    const { parkId } = req.query;

    let sql = `
      SELECT 
        tm.module_id,
        tm.title,
        tm.level,
        tm.criteria,
        tm.park_id,
        u.user_id,
        u.name,
        u.role_id,
        IFNULL(p.progress_percent, 0) as progress_percent,
        p.status,
        p.completion_date,
        c.cert_id,
        c.expiry_date,
        c.issue_date
      FROM training_modules tm
      JOIN users u 
        ON tm.park_id = u.park_id 
       AND u.role_id = 2
      LEFT JOIN progress p 
        ON tm.module_id = p.module_id 
       AND u.user_id = p.user_id
      LEFT JOIN certifications c 
        ON u.user_id = c.user_id 
       AND tm.module_id = c.module_id
    `;

    let params = [];
    if (parkId) {
      sql += " WHERE tm.park_id = ?";
      params.push(parkId);
    }
    sql += " ORDER BY tm.module_id, u.user_id, c.issue_date DESC"; // ✅ 保证最新证书在前

    const [rows] = await pool.query(sql, params);

    const result = [];
    const moduleMap = new Map();

    rows.forEach(row => {
      if (!moduleMap.has(row.module_id)) {
        moduleMap.set(row.module_id, {
          module_id: row.module_id,
          title: row.title,
          level: row.level,
          criteria: row.criteria,
          park_id: row.park_id,
          students: []
        });
        result.push(moduleMap.get(row.module_id));
      }

      const moduleObj = moduleMap.get(row.module_id);

      // ✅ 去重逻辑：避免同一个学生重复插入
      if (!moduleObj.students.some(s => s.id === row.user_id)) {
        moduleObj.students.push({
          id: row.user_id,
          name: row.name,
          progressPercent: parseInt(row.progress_percent),
          status: row.status,
          completionDate: row.completion_date,
          badgeIssued: row.cert_id !== null,
          issueDate: row.issue_date,
          expiryDate: row.expiry_date
        });
      }
    });

    res.json({ badges: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/badges/detail", async (req, res) => {
  try {
    const { parkId } = req.query;
    let sql = `
      SELECT 
        tm.module_id,
        tm.title,
        tm.level,
        tm.criteria,
        tm.park_id,
        u.user_id,
        u.name,
        u.role_id,
        IFNULL(p.progress_percent, 0) as progress_percent,
        p.status,
        p.completion_date,
        c.cert_id,
        c.expiry_date,
        c.issue_date
      FROM training_modules tm
      JOIN users u 
        ON tm.park_id = u.park_id 
       AND u.role_id = 2   -- ✅ 只取 guide 用户
      LEFT JOIN progress p 
        ON tm.module_id = p.module_id 
       AND u.user_id = p.user_id
      LEFT JOIN certifications c 
        ON u.user_id = c.user_id 
       AND tm.module_id = c.module_id
    `;

    let params = [];
    if (parkId) {
      sql += " WHERE tm.park_id = ?";
      params.push(parkId);
    }
    sql += " ORDER BY tm.module_id, u.user_id, c.issue_date DESC";

    const [rows] = await pool.query(sql, params);

    const result = [];
    const moduleMap = new Map();

    rows.forEach(row => {
      if (!moduleMap.has(row.module_id)) {
        moduleMap.set(row.module_id, {
          module_id: row.module_id,
          title: row.title,
          level: row.level,
          criteria: row.criteria,
          park_id: row.park_id,
          students: []
        });
        result.push(moduleMap.get(row.module_id));
      }

      const moduleObj = moduleMap.get(row.module_id);

      if (!moduleObj.students.some(s => s.id === row.user_id)) {
        moduleObj.students.push({
          id: row.user_id,
          name: row.name,
          progressPercent: parseInt(row.progress_percent),
          status: row.status,
          completionDate: row.completion_date,
          badgeIssued: row.cert_id !== null,
          issueDate: row.issue_date,
          expiryDate: row.expiry_date
        });
      }
    });

    res.json({ badges: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT n.notification_id AS id, n.title, n.message, n.is_read, n.created_at
      FROM notifications n
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 20
    `, [userId]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({
      status: 'ok',
      message: 'Admin backend connected to MySQL',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    })
  }
})

app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT 
        course_id,
        course_name,
        description,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        total_contact_hours,
        created_at
      FROM courses
      ORDER BY created_at DESC
    `)

    res.json({ courses })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to load courses.',
      error: error.message,
    })
  }
})

app.post('/api/courses', async (req, res) => {
  try {
    const {
      course_id,
      course_name,
      description,
      start_date,
      end_date,
      total_contact_hours,
    } = req.body

    if (!course_id || !course_name || !start_date || !end_date || !total_contact_hours) {
      return res.status(400).json({
        message: 'Course ID, Course Name, Start Date, End Date and Total Contact Hours are required.',
      })
    }

    await pool.query(
      `INSERT INTO courses 
       (course_id, course_name, description, start_date, end_date, total_contact_hours)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        course_name,
        description || '',
        start_date,
        end_date,
        Number(total_contact_hours),
      ]
    )

    res.status(201).json({
      message: 'Course created successfully.',
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'This Course ID already exists.',
      })
    }

    res.status(500).json({
      message: 'Unable to create course.',
      error: error.message,
    })
  }
})

app.post("/api/admin/badges", async (req, res) => {
  const { title, level, description, criteria, park_id } = req.body;
  try {
    if (!title || !level || !park_id) {
      return res.status(400).json({ error: "Title, level and park_id are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO training_modules (title, level, description, criteria, park_id, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [title, level, description || "", criteria || "Require 100% Progress", park_id, 1]
    );

    const [rows] = await pool.query("SELECT * FROM training_modules WHERE module_id=?", [result.insertId]);

    // ✅ 统一返回结构
    res.status(201).json({ badges: [rows[0]] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post("/api/admin/issue-badge", async (req, res) => {
  const { studentId, badgeId, expiryMonths } = req.body;
  try {
    const months = expiryMonths || 12;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    await pool.query(
      "INSERT INTO certifications (user_id, module_id, issue_date, expiry_date, certificate_code) VALUES (?, ?, NOW(), ?, ?) ON DUPLICATE KEY UPDATE issue_date=NOW(), expiry_date=?",
      [studentId, badgeId, expiryDate, `CERT-${badgeId}-${studentId}`, expiryDate]
    );

    // ✅ 返回更新后的 badge 对象
    const [rows] = await pool.query(`
      SELECT 
        tm.module_id,
        tm.title,
        tm.level,
        tm.criteria,
        u.user_id,
        u.name,
        IFNULL(p.progress_percent, 0) as progress_percent,
        c.cert_id,
        c.expiry_date
      FROM training_modules tm
      CROSS JOIN users u
      LEFT JOIN progress p ON tm.module_id = p.module_id AND u.user_id = p.user_id
      LEFT JOIN certifications c ON u.user_id = c.user_id AND tm.module_id = c.module_id
      WHERE tm.module_id = ?
      ORDER BY u.user_id
    `, [badgeId]);

    const badge = {
      module_id: rows[0].module_id,
      title: rows[0].title,
      level: rows[0].level,
      criteria: rows[0].criteria,
      students: []
    };

    rows.forEach(row => {
      badge.students.push({
        id: row.user_id,
        name: row.name,
        progressPercent: parseInt(row.progress_percent),
        badgeIssued: row.cert_id !== null,
        expiryDate: row.expiry_date
      });
    });

    res.json({ success: true, updatedBadge: badge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params

    const [result] = await pool.query(
      'DELETE FROM courses WHERE course_id = ?',
      [courseId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Course not found.',
      })
    }

    res.json({
      message: 'Course deleted successfully.',
    })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to delete course.',
      error: error.message,
    })
  }
})

app.delete("/api/admin/badges/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM training_modules WHERE module_id=?", [id]);
    res.json({ success: true, badges: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { parkId } = req.query;

    // Active Guides: 统计该公园所有导游人数
    let activeSql = `
      SELECT COUNT(*) AS activeGuides
      FROM users u
      WHERE u.role_id = 2
    `;
    const activeParams = [];
    if (parkId) { activeSql += " AND u.park_id = ?"; activeParams.push(parkId); }
    const [[activeGuides]] = await pool.query(activeSql, activeParams);

    // Total Modules: 按公园过滤
    let moduleSql = "SELECT COUNT(*) AS totalModules FROM training_modules";
    const moduleParams = [];
    if (parkId) { moduleSql += " WHERE park_id = ?"; moduleParams.push(parkId); }
    const [[totalModules]] = await pool.query(moduleSql, moduleParams);
    
    let certSql = `
      SELECT COUNT(DISTINCT c.cert_id) AS certificationsIssued
      FROM certifications c
      JOIN users u ON c.user_id = u.user_id
      WHERE u.role_id = 2
    `;
    const certParams = [];
    if (parkId) { certSql += " AND u.park_id = ?"; certParams.push(parkId); }
    const [[certificationsIssued]] = await pool.query(certSql, certParams);


    // Active Incidents (pending + reviewed): 按公园过滤
    let incidentSql = `
      SELECT COUNT(*) AS activeIncidents
      FROM incidents i
      JOIN users u ON i.guide_id = u.user_id
      WHERE i.status IN ('pending','reviewed')
    `;
    const incidentParams = [];
    if (parkId) { incidentSql += " AND u.park_id = ?"; incidentParams.push(parkId); }
    const [[activeIncidents]] = await pool.query(incidentSql, incidentParams);

    res.json({
      activeGuides: activeGuides.activeGuides,
      totalModules: totalModules.totalModules,
      certificationsIssued: certificationsIssued.certificationsIssued,
      activeIncidents: activeIncidents.activeIncidents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Incident Summary
app.get('/api/dashboard/incidents-summary', async (req, res) => {
  try {
    const { parkId } = req.query;
    const params = [];
    let where = "";
    if (parkId) { where = " WHERE park_id = ?"; params.push(parkId); }

    const [[total]] = await pool.query(`SELECT COUNT(*) AS total FROM incidents${where}`, params);
    const [[ai]] = await pool.query(`SELECT COUNT(*) AS ai FROM incidents${where ? where + " AND" : " WHERE"} incident_type='AI Camera'`, params);
    const [[iot]] = await pool.query(`SELECT COUNT(*) AS iot FROM incidents${where ? where + " AND" : " WHERE"} incident_type='IoT Sensor'`, params);
    const [[newCount]] = await pool.query(`SELECT COUNT(*) AS new FROM incidents${where ? where + " AND" : " WHERE"} status='pending'`, params);
    const [[reviewed]] = await pool.query(`SELECT COUNT(*) AS reviewed FROM incidents${where ? where + " AND" : " WHERE"} status='reviewed'`, params);
    const [[falseAlarm]] = await pool.query(`SELECT COUNT(*) AS falseAlarm FROM incidents${where ? where + " AND" : " WHERE"} status='resolved'`, params);

    res.json({ total: total.total, ai: ai.ai, iot: iot.iot, new: newCount.new, reviewed: reviewed.reviewed, falseAlarm: falseAlarm.falseAlarm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Students
app.get('/api/students', async (req, res) => {
  try {
    const { parkId } = req.query;
    const params = [];
    let sql = `
      SELECT 
        u.user_id, 
        u.name, 
        u.email,
        IFNULL(p.progress_percent,0) AS progressPercent,
        GROUP_CONCAT(c.certificate_code) AS badges
      FROM users u
      LEFT JOIN progress p ON u.user_id = p.user_id
      LEFT JOIN certifications c ON u.user_id = c.user_id
      WHERE u.role_id = 2
    `;
    if (parkId) { sql += " AND u.park_id = ?"; params.push(parkId); }
    sql += " GROUP BY u.user_id";

    const [rows] = await pool.query(sql, params);

    const result = rows.map(r => ({
      user_id: r.user_id,
      name: r.name,
      email: r.email,
      progressPercent: r.progressPercent,
      badges: r.badges ? r.badges.split(",") : []
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guide Progress Trend
app.get('/api/dashboard/guide-progress-trend', async (req, res) => {
  try {
    const { parkId } = req.query;
    const params = [];
    let sql = `
      SELECT CONCAT('Week ', WEEK(p.completion_date)) AS week,
             COUNT(CASE WHEN p.status='completed' THEN 1 END) AS completed,
             COUNT(c.cert_id) AS certified
      FROM progress p
      JOIN users u ON p.user_id = u.user_id AND u.role_id = 2
      LEFT JOIN certifications c ON p.user_id = c.user_id AND p.module_id = c.module_id
      WHERE p.completion_date IS NOT NULL
    `;
    if (parkId) { sql += " AND u.park_id = ?"; params.push(parkId); }
    sql += " GROUP BY WEEK(p.completion_date) ORDER BY WEEK(p.completion_date) LIMIT 4";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT) || 4001

app.listen(port, () => {
  console.log(`Admin database server running on http://localhost:${port}`)
})

