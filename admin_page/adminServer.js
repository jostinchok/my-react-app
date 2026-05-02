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

// ✅ 修复版：获取徽章与导游数据（解决空数据问题）
app.get('/api/admin/badges', async (req, res) => {
  try {
    const { parkId } = req.query;

    // 1. 参数校验
    if (!parkId) {
      return res.status(400).json({ error: "parkId is required" });
    }

    // 2. 第一步：获取当前公园下的所有导游 (核心：以 Users 为起点，确保人不会丢)
    const [userRows] = await pool.query(
      `SELECT user_id, name FROM users 
       WHERE park_id = ? AND role_id = 2 
       ORDER BY name`, 
      [parkId]
    );

    // 3. 第二步：获取当前公园下的所有徽章/课程
    const [moduleRows] = await pool.query(
      `SELECT module_id, title, level, criteria, park_id FROM training_modules 
       WHERE park_id = ? 
       ORDER BY title`, 
      [parkId]
    );

    // 4. 第三步：获取所有进度和证书数据 (用于填充)
    let progressRows = [];
    let certRows = [];
    
    if (userRows.length > 0 && moduleRows.length > 0) {
      // 批量查询进度
      const [progressResult] = await pool.query(
        `SELECT user_id, module_id, progress_percent, status 
         FROM progress 
         WHERE user_id IN (?) AND module_id IN (?)`,
        [userRows.map(u => u.user_id), moduleRows.map(m => m.module_id)]
      );
      progressRows = progressResult;

      // 批量查询证书
      const [certResult] = await pool.query(
        `SELECT user_id, module_id, cert_id, issue_date, expiry_date 
         FROM certifications 
         WHERE user_id IN (?) AND module_id IN (?)`,
        [userRows.map(u => u.user_id), moduleRows.map(m => m.module_id)]
      );
      certRows = certResult;
    }

    // 5. 第四步：数据组装 (笛卡尔积逻辑：每个课程都对应所有导游)
    const result = moduleRows.map(module => {
      // 为当前课程创建一个进度/证书索引 Map，方便快速查找
      const progressMap = new Map();
      progressRows.forEach(p => {
        if (p.module_id === module.module_id) {
          progressMap.set(p.user_id, p);
        }
      });

      const certMap = new Map();
      certRows.forEach(c => {
        if (c.module_id === module.module_id) {
          certMap.set(c.user_id, c);
        }
      });

      // 构建学生列表：包含该公园下的所有导游
      const students = userRows.map(user => {
        const progress = progressMap.get(user.user_id) || null;
        const cert = certMap.get(user.user_id) || null;

        return {
          id: user.user_id,
          name: user.name,
          progressPercent: progress ? parseInt(progress.progress_percent) : 0,
          status: progress ? progress.status : 'not_started',
          completionDate: progress ? progress.completion_date : null,
          badgeIssued: cert !== null,
          issueDate: cert ? cert.issue_date : null,
          expiryDate: cert ? cert.expiry_date : null
        };
      });

      return {
        module_id: module.module_id,
        title: module.title,
        level: module.level,
        criteria: module.criteria,
        park_id: module.park_id,
        students: students
      };
    });

    res.json({ badges: result });

  } catch (error) {
    console.error("Badge Fetch Error:", error);
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
        IFNULL(p.progress_percent, 0) AS progress_percent,
        p.status,
        p.completion_date,
        c.cert_id,
        c.expiry_date,
        c.issue_date,
        c.certificate_code
      FROM training_modules tm
      JOIN users u 
        ON tm.park_id = u.park_id 
       AND u.role_id = 2 
      LEFT JOIN progress p 
        ON tm.module_id = p.module_id 
       AND u.user_id = p.user_id
       AND p.completion_date = (
         SELECT MAX(p2.completion_date)
         FROM progress p2
         WHERE p2.user_id = u.user_id AND p2.module_id = tm.module_id
       )
      LEFT JOIN certifications c 
          ON u.user_id = c.user_id 
        AND tm.module_id = c.module_id
        AND c.cert_id = (
          SELECT MAX(c2.cert_id)
          FROM certifications c2
          WHERE c2.user_id = u.user_id 
            AND c2.module_id = tm.module_id
            AND c2.certificate_code IS NOT NULL
        )
    `;

    let params = [];
    if (parkId) {
      sql += " WHERE tm.park_id = ?";
      params.push(parkId);
    }
    sql += " ORDER BY tm.module_id, u.user_id";

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
          badgeIssued: row.cert_id !== null,   // ✅ 只会在有有效证书时为 true
          issueDate: row.issue_date,
          expiryDate: row.expiry_date,
          badges: row.certificate_code ? [row.certificate_code] : []
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

    // 如果没有传 parkId，直接报错
    if (!parkId) {
      return res.status(400).json({ error: "parkId is required" });
    }

    // Active Guides: 只统计当前公园的导游
    const [[activeGuides]] = await pool.query(
      `SELECT COUNT(*) AS activeGuides
       FROM users u
       WHERE u.role_id = 2 AND u.park_id = ?`,
      [parkId]
    );

    // Total Modules: 只统计当前公园的模块
    const [[totalModules]] = await pool.query(
      `SELECT COUNT(*) AS totalModules
       FROM training_modules
       WHERE park_id = ?`,
      [parkId]
    );

    // Certifications Issued: 只统计当前公园的证书
    const [[certificationsIssued]] = await pool.query(
      `SELECT COUNT(DISTINCT c.cert_id) AS certificationsIssued
       FROM certifications c
       JOIN users u ON c.user_id = u.user_id
       WHERE u.role_id = 2 AND u.park_id = ?`,
      [parkId]
    );

    const [[activeIncidents]] = await pool.query(
      `SELECT COUNT(*) AS activeIncidents
       FROM incidents i
       JOIN users u ON i.guide_id = u.user_id
       WHERE i.status IN ('pending','reviewed') AND u.park_id = ?`,
      [parkId]
    );

    const [[totalGuides]] = await pool.query(
      `SELECT COUNT(*) AS totalGuides
       FROM users
       WHERE role_id = 2 AND park_id = ?`,
      [parkId]
    );

    // Certified Guides
    const [[certified]] = await pool.query(
      `SELECT COUNT(DISTINCT c.user_id) AS certified
       FROM certifications c
       JOIN users u ON c.user_id = u.user_id
       WHERE u.role_id = 2 AND u.park_id = ?`,
      [parkId]
    );

    // In Training Guides
    const [[inTraining]] = await pool.query(
      `SELECT COUNT(*) AS inTraining
       FROM progress p
       JOIN users u ON p.user_id = u.user_id
       WHERE u.role_id = 2 AND u.park_id = ? AND p.status='in_progress'`,
      [parkId]
    );

    res.json({
      activeGuides: activeGuides.activeGuides,
      totalModules: totalModules.totalModules,
      certificationsIssued: certificationsIssued.certificationsIssued,
      activeIncidents: activeIncidents.activeIncidents,
      totalGuides: totalGuides.totalGuides,
      certified: certified.certified,
      inTraining: inTraining.inTraining,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// 获取所有学生
app.get("/api/students", async (req, res) => {
  try {
    const { parkId } = req.query;
    let sql = `
      SELECT u.user_id AS id, u.name, u.email, u.park_id, p.park_name,
             gp.phone, gp.organization, gp.address, gp.years_experience AS yearsExperience,
             ua.stored_name AS avatar_url, gp.guide_id AS guideId,
             tm.title AS module, IFNULL(pr.progress_percent, 0) AS progressPercent,
             GROUP_CONCAT(c.certificate_code) AS badges
      FROM users u
      LEFT JOIN guide_profiles gp ON u.user_id = gp.user_id
      LEFT JOIN user_avatars ua ON u.user_id = ua.user_id
      LEFT JOIN progress pr ON u.user_id = pr.user_id
      LEFT JOIN training_modules tm ON pr.module_id = tm.module_id
      LEFT JOIN certifications c ON u.user_id = c.user_id
      LEFT JOIN parks p ON u.park_id = p.park_id
      WHERE u.role_id = 2
    `;
    const params = [];
    if (parkId) {
      sql += " AND u.park_id = ?";
      params.push(parkId);
    }
    sql += " GROUP BY u.user_id";

    const [rows] = await pool.query(sql, params);

    const result = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      park_id: r.park_id,
      park_name: r.park_name,
      phone: r.phone,
      organization: r.organization,
      address: r.address,
      yearsExperience: r.yearsExperience,
      avatar_url: r.avatar_url,
      guideId: r.guideId,
      module: r.module || "None",
      progressPercent: r.progressPercent,
      badges: r.badges ? r.badges.split(",") : []
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个学生
app.get("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT u.user_id AS id, u.name, u.email, u.park_id, p.park_name,
             gp.phone, gp.organization, gp.address, gp.years_experience AS yearsExperience,
             ua.stored_name AS avatar_url, gp.guide_id AS guideId,
             IFNULL(pr.progress_percent, 0) AS progressPercent,
             tm.title AS module, pr.status, pr.completion_date
      FROM users u
      LEFT JOIN guide_profiles gp ON u.user_id = gp.user_id
      LEFT JOIN user_avatars ua ON u.user_id = ua.user_id
      LEFT JOIN progress pr ON u.user_id = pr.user_id
      LEFT JOIN training_modules tm ON pr.module_id = tm.module_id
      LEFT JOIN parks p ON u.park_id = p.park_id
      WHERE u.user_id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Student not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增学生
app.post("/api/students", async (req, res) => {
  try {
    const { name, email, phone, organization, address, yearsExperience, parkId } = req.body;

    const [userResult] = await pool.query(
      "INSERT INTO users (name, email, role_id, park_id) VALUES (?, ?, 2, ?)",
      [name, email, parkId || null]
    );
    const userId = userResult.insertId; 

    await pool.query(
      "INSERT INTO guide_profiles (guide_id, user_id, phone, organization, address, years_experience, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
      [userId, userId, phone || null, organization || null, address || null, yearsExperience || 0]
    );

    const [rows] = await pool.query(
      `SELECT u.user_id AS id, u.name, u.email, u.park_id, p.park_name,
              gp.phone, gp.organization, gp.address, gp.years_experience AS yearsExperience,
              ua.stored_name AS avatar_url, gp.guide_id AS guideId
       FROM users u
       LEFT JOIN guide_profiles gp ON u.user_id = gp.user_id
       LEFT JOIN user_avatars ua ON u.user_id = ua.user_id
       LEFT JOIN parks p ON u.park_id = p.park_id
       WHERE u.user_id = ?`, [userId]
    );

    res.status(201).json({ ...rows[0], progressPercent: 0, module: "None" });
    
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "邮箱已存在" });
    }
    console.error("Add failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, yearsExperience, parkId, organization } = req.body;

    await pool.query("UPDATE users SET name=?, email=?, park_id=? WHERE user_id=?", [name, email, parkId, id]);
    await pool.query("UPDATE guide_profiles SET phone=?, address=?, years_experience=?, organization=? WHERE user_id=?", [phone, address, yearsExperience, organization, id]);

    const [rows] = await pool.query(
      `SELECT u.user_id AS id, u.name, u.email, u.park_id, p.park_name,
              gp.phone, gp.address, gp.years_experience AS yearsExperience,
              gp.organization, ua.stored_name AS avatar_url, gp.guide_id AS guideId
       FROM users u
       LEFT JOIN guide_profiles gp ON u.user_id = gp.user_id
       LEFT JOIN user_avatars ua ON u.user_id = ua.user_id
       LEFT JOIN parks p ON u.park_id = p.park_id
       WHERE u.user_id = ?`, [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Student not found" });
    res.json({ ...rows[0], progressPercent: rows[0].progressPercent || 0, module: rows[0].module || "None" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除学生
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM guide_profiles WHERE user_id=?", [id]);
    await pool.query("DELETE FROM user_avatars WHERE user_id=?", [id]); // 删除头像记录
    await pool.query("DELETE FROM users WHERE user_id=?", [id]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新学生模块
app.put("/api/students/:id/module", async (req, res) => {
  try {
    const { id } = req.params;
    const { module } = req.body;

    const [moduleRows] = await pool.query("SELECT module_id FROM training_modules WHERE title = ?", [module]);
    if (moduleRows.length === 0) return res.status(404).json({ error: "Module not found" });
    const module_id = moduleRows[0].module_id;

    await pool.query(
      "INSERT INTO progress (user_id, module_id, status, progress_percent) VALUES (?, ?, 'in_progress', 0) ON DUPLICATE KEY UPDATE status='in_progress', progress_percent=0",
      [id, module_id]
    );

    const [rows] = await pool.query(
      `SELECT u.user_id AS id, u.name, u.email, u.park_id, p.park_name,
              gp.phone, gp.organization, gp.address, gp.years_experience AS yearsExperience,
              ua.stored_name AS avatar_url, gp.guide_id AS guideId,
              ? AS module, 0 AS progressPercent
       FROM users u
       LEFT JOIN guide_profiles gp ON u.user_id = gp.user_id
       LEFT JOIN user_avatars ua ON u.user_id = ua.user_id
       LEFT JOIN parks p ON u.park_id = p.park_id
       WHERE u.user_id = ?`, [module, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = Number(process.env.PORT) || 4001

app.listen(port, () => {
  console.log(`Admin database server running on http://localhost:${port}`)
})

