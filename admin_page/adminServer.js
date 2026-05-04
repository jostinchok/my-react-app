import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_ROOT = path.join(__dirname, 'uploads')
const MODULE_MEDIA_DIR = path.join(UPLOAD_ROOT, 'module-media')
fs.mkdirSync(MODULE_MEDIA_DIR, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODULE_MEDIA_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ext || ''
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`)
  },
})
const upload = multer({ storage })

app.use(
  cors({
    exposedHeaders: ['Content-Range'],
  })
)
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_ROOT))

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
// Check if a column exists in a table
async function columnExists(poolConn, table, column) {
  const [r] = await poolConn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  )
  return r.length > 0
}

async function tableExists(poolConn, name) {
  const [r] = await poolConn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [name]
  )
  return r.length > 0
}

async function indexExists(poolConn, table, indexName) {
  const [r] = await poolConn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  )
  return r.length > 0
}

/** Best-effort migrations so an older local DB matches admin_page + database/db.sql */
async function ensureAdminSchema(poolConn) {
  const tryQ = async (sql, label) => {
    try {
      await poolConn.query(sql)
      if (label) console.log(`[admin schema] ${label}`)
    } catch (e) {
      const ignorable =
        e.code === 'ER_DUP_FIELDNAME' ||
        e.code === 'ER_DUP_KEYNAME' ||
        e.code === 'ER_DUP_CONSTRAINT_NAME' ||
        e.errno === 1826 ||
        e.errno === 1061
      if (!ignorable) console.warn(`[admin schema] ${label || 'query'}:`, e.message)
    }
  }

  await tryQ(
    `CREATE TABLE IF NOT EXISTS parks (
      park_id INT AUTO_INCREMENT PRIMARY KEY,
      park_name VARCHAR(100) NOT NULL
    )`,
    'parks table'
  )
  await tryQ(
    `INSERT IGNORE INTO parks (park_id, park_name) VALUES
      (1, 'Bako National Park'),
      (2, 'Gunung Gading National Park'),
      (3, 'Kubah National Park')`,
    'parks seed'
  )

  await tryQ(
    `CREATE TABLE IF NOT EXISTS courses (
      course_id VARCHAR(50) PRIMARY KEY,
      course_name VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_contact_hours INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    'courses table'
  )

  if (!(await columnExists(poolConn, 'users', 'park_id'))) {
    await tryQ('ALTER TABLE users ADD COLUMN park_id INT NULL', 'users.park_id column')
    await tryQ(
      'ALTER TABLE users ADD CONSTRAINT fk_admin_users_park FOREIGN KEY (park_id) REFERENCES parks(park_id)',
      'users.park_id foreign key'
    )
  }
  await tryQ('UPDATE users SET park_id = 1 WHERE park_id IS NULL', 'users.park_id backfill default')

  if (!(await columnExists(poolConn, 'training_modules', 'criteria'))) {
    await tryQ('ALTER TABLE training_modules ADD COLUMN criteria VARCHAR(255) NULL', 'training_modules.criteria')
  }
  if (!(await columnExists(poolConn, 'training_modules', 'park_id'))) {
    await tryQ('ALTER TABLE training_modules ADD COLUMN park_id INT NULL', 'training_modules.park_id column')
    await tryQ(
      'ALTER TABLE training_modules ADD CONSTRAINT fk_admin_training_modules_park FOREIGN KEY (park_id) REFERENCES parks(park_id)',
      'training_modules.park_id foreign key'
    )
  }
  if (!(await columnExists(poolConn, 'training_modules', 'course_id'))) {
    await tryQ('ALTER TABLE training_modules ADD COLUMN course_id VARCHAR(50) NULL', 'training_modules.course_id column')
    await tryQ(
      'ALTER TABLE training_modules ADD CONSTRAINT fk_admin_training_modules_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE',
      'training_modules.course_id foreign key'
    )
  }
  if (!(await columnExists(poolConn, 'training_modules', 'status'))) {
    await tryQ("ALTER TABLE training_modules ADD COLUMN status VARCHAR(30) DEFAULT 'Draft'", 'training_modules.status column')
  }
  if (!(await columnExists(poolConn, 'training_modules', 'sort_order'))) {
    await tryQ('ALTER TABLE training_modules ADD COLUMN sort_order INT DEFAULT 0', 'training_modules.sort_order column')
  }
  if (!(await columnExists(poolConn, 'lessons', 'lesson_type'))) {
    await tryQ("ALTER TABLE lessons ADD COLUMN lesson_type VARCHAR(20) DEFAULT 'text'", 'lessons.lesson_type column')
  }
  if (!(await columnExists(poolConn, 'lessons', 'sort_order'))) {
    await tryQ('ALTER TABLE lessons ADD COLUMN sort_order INT DEFAULT 0', 'lessons.sort_order column')
  }
  if (!(await columnExists(poolConn, 'quizzes', 'sort_order'))) {
    await tryQ('ALTER TABLE quizzes ADD COLUMN sort_order INT DEFAULT 0', 'quizzes.sort_order column')
  }
  if (!(await columnExists(poolConn, 'questions', 'sort_order'))) {
    await tryQ('ALTER TABLE questions ADD COLUMN sort_order INT DEFAULT 0', 'questions.sort_order column')
  }
  if (!(await columnExists(poolConn, 'options', 'sort_order'))) {
    await tryQ('ALTER TABLE options ADD COLUMN sort_order INT DEFAULT 0', 'options.sort_order column')
  }
  await tryQ(
    `UPDATE training_modules SET park_id = 1 WHERE module_id = 1 AND park_id IS NULL`,
    'training_modules park_id ← module 1'
  )
  await tryQ(
    `UPDATE training_modules SET park_id = 2 WHERE module_id = 2 AND park_id IS NULL`,
    'training_modules park_id ← module 2'
  )
  await tryQ(
    `UPDATE training_modules SET park_id = 3 WHERE module_id = 3 AND park_id IS NULL`,
    'training_modules park_id ← module 3'
  )

  if (await tableExists(poolConn, 'incidents') && !(await columnExists(poolConn, 'incidents', 'park_id'))) {
    await tryQ('ALTER TABLE incidents ADD COLUMN park_id INT NULL', 'incidents.park_id column')
    await tryQ(
      'ALTER TABLE incidents ADD CONSTRAINT fk_admin_incidents_park FOREIGN KEY (park_id) REFERENCES parks(park_id)',
      'incidents.park_id foreign key'
    )
  }

  if (await tableExists(poolConn, 'progress') && !(await columnExists(poolConn, 'progress', 'progress_percent'))) {
    await tryQ(
      'ALTER TABLE progress ADD COLUMN progress_percent INT DEFAULT 0',
      'progress.progress_percent'
    )
  }

  if (await tableExists(poolConn, 'certifications') && !(await columnExists(poolConn, 'certifications', 'certificate_code'))) {
    await tryQ(
      'ALTER TABLE certifications ADD COLUMN certificate_code VARCHAR(100) NULL',
      'certifications.certificate_code'
    )
  }
  if (await tableExists(poolConn, 'certifications') && !(await indexExists(poolConn, 'certifications', 'uniq_certifications_user_module'))) {
    await tryQ(
      'ALTER TABLE certifications ADD UNIQUE KEY uniq_certifications_user_module (user_id, module_id)',
      'certifications unique (user_id, module_id)'
    )
  }

  if (await tableExists(poolConn, 'guide_profiles') && !(await columnExists(poolConn, 'guide_profiles', 'user_id'))) {
    await tryQ('ALTER TABLE guide_profiles ADD COLUMN user_id INT NULL', 'guide_profiles.user_id column')
    await tryQ('UPDATE guide_profiles SET user_id = guide_id WHERE user_id IS NULL', 'guide_profiles.user_id backfill')
    await tryQ(
      'ALTER TABLE guide_profiles MODIFY COLUMN user_id INT NOT NULL',
      'guide_profiles.user_id NOT NULL'
    )
    await tryQ(
      'ALTER TABLE guide_profiles ADD UNIQUE KEY unique_guide_profiles_user_id (user_id)',
      'guide_profiles unique user_id'
    )
  }
  if (await tableExists(poolConn, 'guide_profiles') && !(await columnExists(poolConn, 'guide_profiles', 'phone'))) {
    await tryQ('ALTER TABLE guide_profiles ADD COLUMN phone VARCHAR(20) NULL', 'guide_profiles.phone')
  }
  if (await tableExists(poolConn, 'guide_profiles') && !(await columnExists(poolConn, 'guide_profiles', 'address'))) {
    await tryQ('ALTER TABLE guide_profiles ADD COLUMN address VARCHAR(255) NULL', 'guide_profiles.address')
  }
  if (await tableExists(poolConn, 'guide_profiles') && !(await columnExists(poolConn, 'guide_profiles', 'birthday'))) {
    await tryQ('ALTER TABLE guide_profiles ADD COLUMN birthday DATE NULL', 'guide_profiles.birthday')
  }

  await tryQ(
    `CREATE TABLE IF NOT EXISTS user_avatars (
      user_id INT PRIMARY KEY,
      stored_name VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`,
    'user_avatars table'
  )

  await tryQ(
    `CREATE TABLE IF NOT EXISTS course_enrollments (
      enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id VARCHAR(50) NOT NULL,
      status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME NULL,
      reviewed_by INT NULL,
      remarks VARCHAR(255) NULL,
      UNIQUE KEY uniq_course_enrollment_user_course (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
    )`,
    'course_enrollments table'
  )

  console.log('[admin schema] ready')
}


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

// Minimal list endpoint for react-admin Resource name="badge" (actual data loads via /api/admin/badges)
app.get('/api/badge', (_req, res) => {
  res.setHeader('Content-Range', 'badge */0')
  res.json([])
})

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

const normalizeQuizQuestions = (rawQuestions = []) => {
  return rawQuestions.map((q) => {
    const normalizedOptions = Array.isArray(q.options) ? q.options.map((opt) => String(opt ?? '')) : []
    const normalizedAnswer = q.answer ?? ''
    let answerIndex = Number.isInteger(q.answerIndex) ? q.answerIndex : normalizedOptions.findIndex((opt) => opt === normalizedAnswer)
    if (answerIndex < 0) answerIndex = 0
    return {
      question: String(q.question || ''),
      options: normalizedOptions,
      answer: normalizedAnswer || normalizedOptions[answerIndex] || '',
      answerIndex,
      score: Math.max(0, Number(q.score) || 0),
    }
  })
}

async function clearModuleContent(moduleId, conn = pool) {
  const [quizRows] = await conn.query('SELECT quiz_id FROM quizzes WHERE module_id = ?', [moduleId])
  const quizIds = quizRows.map((q) => q.quiz_id)
  if (quizIds.length) {
    const [questionRows] = await conn.query('SELECT question_id FROM questions WHERE quiz_id IN (?)', [quizIds])
    const questionIds = questionRows.map((q) => q.question_id)
    if (questionIds.length) {
      await conn.query('DELETE FROM options WHERE question_id IN (?)', [questionIds])
    }
    await conn.query('DELETE FROM questions WHERE quiz_id IN (?)', [quizIds])
    await conn.query('DELETE FROM quizzes WHERE quiz_id IN (?)', [quizIds])
  }
  await conn.query('DELETE FROM lessons WHERE module_id = ?', [moduleId])
}

async function saveModuleBlocks(moduleId, blocks = [], conn = pool) {
  let blockOrder = 0
  for (const block of blocks) {
    const type = String(block?.type || 'text')
    if (type === 'quiz') {
      const [quizResult] = await conn.query(
        'INSERT INTO quizzes (module_id, title, sort_order) VALUES (?, ?, ?)',
        [moduleId, block.title || 'Quiz', blockOrder]
      )
      const quizId = quizResult.insertId
      const questions = normalizeQuizQuestions(block.questions)
      for (let questionOrder = 0; questionOrder < questions.length; questionOrder += 1) {
        const q = questions[questionOrder]
        const [questionResult] = await conn.query(
          'INSERT INTO questions (quiz_id, question_text, sort_order) VALUES (?, ?, ?)',
          [quizId, q.question, questionOrder]
        )
        const questionId = questionResult.insertId
        for (let optionOrder = 0; optionOrder < q.options.length; optionOrder += 1) {
          const optionText = q.options[optionOrder]
          await conn.query(
            'INSERT INTO options (question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?)',
            [questionId, optionText, optionOrder === q.answerIndex ? 1 : 0, optionOrder]
          )
        }
      }
    } else {
      const lessonType = type === 'video' || type === 'image' ? type : 'text'
      const title = block.title || (lessonType === 'text' ? 'Lesson' : lessonType === 'video' ? 'Video' : 'Image')
      const content = lessonType === 'text' ? (block.content || '') : (block.caption || '')
      const mediaUrl = lessonType === 'text' ? null : (block.media_url || block.mediaUrl || null)
      await conn.query(
        'INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [moduleId, title, content, mediaUrl, lessonType, blockOrder]
      )
    }
    blockOrder += 1
  }
}

async function fetchCourseModules(courseId, conn = pool) {
  const [moduleRows] = await conn.query(
    `SELECT module_id, title, description, status, level, criteria, park_id, sort_order
     FROM training_modules
     WHERE course_id = ?
     ORDER BY sort_order ASC, module_id ASC`,
    [courseId]
  )
  if (!moduleRows.length) return []

  const moduleIds = moduleRows.map((m) => m.module_id)
  const [lessonRows] = await conn.query(
    `SELECT lesson_id, module_id, title, content, media_url, lesson_type, sort_order
     FROM lessons
     WHERE module_id IN (?)
     ORDER BY sort_order ASC, lesson_id ASC`,
    [moduleIds]
  )
  const [quizRows] = await conn.query(
    `SELECT q.quiz_id, q.module_id, q.title, q.sort_order AS quiz_order,
            qs.question_id, qs.question_text, qs.sort_order AS question_order,
            o.option_id, o.option_text, o.is_correct, o.sort_order AS option_order
     FROM quizzes q
     LEFT JOIN questions qs ON q.quiz_id = qs.quiz_id
     LEFT JOIN options o ON qs.question_id = o.question_id
     WHERE q.module_id IN (?)
     ORDER BY q.sort_order ASC, q.quiz_id ASC, qs.sort_order ASC, qs.question_id ASC, o.sort_order ASC, o.option_id ASC`,
    [moduleIds]
  )

  const blocksByModule = new Map()
  moduleIds.forEach((id) => blocksByModule.set(id, []))

  lessonRows.forEach((lesson) => {
    const list = blocksByModule.get(lesson.module_id)
    if (!list) return
    list.push({
      id: `lesson-${lesson.lesson_id}`,
      _sort: Number(lesson.sort_order) || 0,
      type: lesson.lesson_type || 'text',
      title: lesson.title || '',
      content: lesson.content || '',
      caption: lesson.lesson_type === 'text' ? '' : (lesson.content || ''),
      media_url: lesson.media_url || '',
    })
  })

  const quizMap = new Map()
  quizRows.forEach((row) => {
    if (!row.quiz_id) return
    const quizKey = row.quiz_id
    if (!quizMap.has(quizKey)) {
      const list = blocksByModule.get(row.module_id)
      const quizBlock = {
        id: `quiz-${row.quiz_id}`,
        _sort: Number(row.quiz_order) || 0,
        type: 'quiz',
        title: row.title || 'Quiz',
        questions: [],
      }
      quizMap.set(quizKey, { rowModuleId: row.module_id, block: quizBlock, questionMap: new Map() })
      if (list) list.push(quizBlock)
    }
    const entry = quizMap.get(quizKey)
    if (!row.question_id) return
    if (!entry.questionMap.has(row.question_id)) {
      const question = {
        question: row.question_text || '',
        options: [],
        answer: '',
        score: 0,
        _order: Number(row.question_order) || 0,
      }
      entry.questionMap.set(row.question_id, question)
      entry.block.questions.push(question)
    }
    const q = entry.questionMap.get(row.question_id)
    if (row.option_id) {
      q.options.push(row.option_text || '')
      if (Number(row.is_correct) === 1) {
        q.answer = row.option_text || ''
        q.answerIndex = q.options.length - 1
      }
    }
  })

  return moduleRows.map((module) => {
    const blocks = (blocksByModule.get(module.module_id) || [])
      .sort((a, b) => a._sort - b._sort)
      .map((b) => {
        const block = { ...b }
        delete block._sort
        if (block.type === 'quiz') {
          block.questions = (block.questions || [])
            .sort((a, b) => (a._order || 0) - (b._order || 0))
            .map((q) => {
              const next = { ...q }
              delete next._order
              return next
            })
        }
        return block
      })
    return {
      id: module.module_id,
      title: module.title || 'Untitled module',
      description: module.description || '',
      status: module.status || 'Draft',
      level: module.level || '',
      criteria: module.criteria || '',
      park_id: module.park_id || null,
      contentBlocks: blocks,
    }
  })
}

app.get('/api/courses', async (req, res) => {
  const listCoursesBasic = async () => {
    const [rows] = await pool.query(`
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
    return rows.map((c) => ({ ...c, module_count: 0 }))
  }

  try {
    const hasCourseFk = await columnExists(pool, 'training_modules', 'course_id')
    let courses
    if (hasCourseFk) {
      const [rows] = await pool.query(`
        SELECT
          c.course_id,
          c.course_name,
          c.description,
          DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
          DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
          c.total_contact_hours,
          COUNT(tm.module_id) AS module_count,
          c.created_at
        FROM courses c
        LEFT JOIN training_modules tm ON tm.course_id = c.course_id
        GROUP BY
          c.course_id,
          c.course_name,
          c.description,
          c.start_date,
          c.end_date,
          c.total_contact_hours,
          c.created_at
        ORDER BY c.created_at DESC
      `)
      courses = rows
    } else {
      courses = await listCoursesBasic()
    }

    res.json({ courses })
  } catch (error) {
    const msg = String(error.message || '')
    const unknownCol =
      error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054 || msg.includes('Unknown column')
    const missingCourseFk = unknownCol && msg.includes('course_id')
    try {
      if (missingCourseFk) {
        const courses = await listCoursesBasic()
        return res.json({ courses })
      }
    } catch (err2) {
      return res.status(500).json({
        message: 'Unable to load courses.',
        error: err2.message,
      })
    }
    console.error('[api/courses]', error.code, error.message)
    res.status(500).json({
      message: 'Unable to load courses.',
      error: error.message,
    })
  }
})

app.get('/api/courses/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params
    const modules = await fetchCourseModules(courseId)
    res.json({ modules })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to load modules for course.',
      error: error.message,
    })
  }
})

app.post('/api/courses/:courseId/modules', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { courseId } = req.params
    const { title, description, status, level, criteria, park_id, contentBlocks } = req.body

    if (!title) return res.status(400).json({ message: 'Module title is required.' })

    const [existing] = await connection.query('SELECT course_id FROM courses WHERE course_id = ?', [courseId])
    if (!existing.length) return res.status(404).json({ message: 'Course not found.' })

    await connection.beginTransaction()
    const [[nextOrderRow]] = await connection.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM training_modules WHERE course_id = ?',
      [courseId]
    )
    const [moduleResult] = await connection.query(
      `INSERT INTO training_modules
       (course_id, title, description, status, level, criteria, park_id, created_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, title, description || '', status || 'Draft', level || null, criteria || null, park_id || null, 1, Number(nextOrderRow.next_order) || 0]
    )
    await saveModuleBlocks(moduleResult.insertId, Array.isArray(contentBlocks) ? contentBlocks : [], connection)
    await connection.commit()

    const modules = await fetchCourseModules(courseId, connection)
    const created = modules.find((m) => Number(m.id) === Number(moduleResult.insertId))
    res.status(201).json({ module: created || null })
  } catch (error) {
    try { await connection.rollback() } catch {}
    res.status(500).json({ message: 'Unable to create module.', error: error.message })
  } finally {
    connection.release()
  }
})

app.put('/api/courses/:courseId/modules/:moduleId', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { courseId, moduleId } = req.params
    const { title, description, status, level, criteria, park_id, contentBlocks } = req.body
    const [rows] = await connection.query(
      'SELECT module_id FROM training_modules WHERE module_id = ? AND course_id = ?',
      [moduleId, courseId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Module not found for this course.' })

    await connection.beginTransaction()
    await connection.query(
      `UPDATE training_modules
       SET title = ?, description = ?, status = ?, level = ?, criteria = ?, park_id = ?
       WHERE module_id = ? AND course_id = ?`,
      [title || 'Untitled module', description || '', status || 'Draft', level || null, criteria || null, park_id || null, moduleId, courseId]
    )
    await clearModuleContent(moduleId, connection)
    await saveModuleBlocks(moduleId, Array.isArray(contentBlocks) ? contentBlocks : [], connection)
    await connection.commit()

    const modules = await fetchCourseModules(courseId, connection)
    const updated = modules.find((m) => Number(m.id) === Number(moduleId))
    res.json({ module: updated || null })
  } catch (error) {
    try { await connection.rollback() } catch {}
    res.status(500).json({ message: 'Unable to update module.', error: error.message })
  } finally {
    connection.release()
  }
})

app.delete('/api/courses/:courseId/modules/:moduleId', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { courseId, moduleId } = req.params
    const [rows] = await connection.query(
      'SELECT module_id FROM training_modules WHERE module_id = ? AND course_id = ?',
      [moduleId, courseId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Module not found for this course.' })
    await connection.beginTransaction()
    await clearModuleContent(moduleId, connection)
    await connection.query('DELETE FROM training_modules WHERE module_id = ? AND course_id = ?', [moduleId, courseId])
    await connection.commit()
    res.json({ success: true, moduleId: Number(moduleId) })
  } catch (error) {
    try { await connection.rollback() } catch {}
    res.status(500).json({ message: 'Unable to remove module.', error: error.message })
  } finally {
    connection.release()
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

app.put('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const {
      course_name,
      description,
      start_date,
      end_date,
      total_contact_hours,
    } = req.body

    if (!course_name || !start_date || !end_date || !total_contact_hours) {
      return res.status(400).json({
        message: 'Course name, start date, end date and total contact hours are required.',
      })
    }

    const [result] = await pool.query(
      `UPDATE courses
       SET course_name = ?, description = ?, start_date = ?, end_date = ?, total_contact_hours = ?
       WHERE course_id = ?`,
      [
        course_name,
        description || '',
        start_date,
        end_date,
        Number(total_contact_hours),
        courseId,
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Course not found.',
      })
    }

    const [[updated]] = await pool.query(
      `SELECT
         course_id,
         course_name,
         description,
         DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
         total_contact_hours,
         created_at
       FROM courses
       WHERE course_id = ?`,
      [courseId]
    )

    res.json({
      message: 'Course updated successfully.',
      course: updated,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update course.',
      error: error.message,
    })
  }
})

app.get('/api/enrollments/requests', async (req, res) => {
  try {
    const status = String(req.query.status || 'pending').toLowerCase()
    const validStatuses = new Set(['pending', 'approved', 'declined', 'all'])
    if (!validStatuses.has(status)) {
      return res.status(400).json({ message: 'Invalid status filter.' })
    }

    const params = []
    let whereSql = ''
    if (status !== 'all') {
      whereSql = 'WHERE ce.status = ?'
      params.push(status)
    }

    const [rows] = await pool.query(
      `SELECT
         ce.enrollment_id,
         ce.user_id,
         ce.course_id,
         ce.status,
         ce.requested_at,
         ce.reviewed_at,
         ce.remarks,
         u.name AS user_name,
         u.email AS user_email,
         c.course_name,
         c.start_date,
         c.end_date,
         c.total_contact_hours,
         reviewer.name AS reviewed_by_name
       FROM course_enrollments ce
       INNER JOIN users u ON u.user_id = ce.user_id
       INNER JOIN courses c ON c.course_id = ce.course_id
       LEFT JOIN users reviewer ON reviewer.user_id = ce.reviewed_by
       ${whereSql}
       ORDER BY
         CASE ce.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         ce.requested_at DESC`,
      params
    )

    res.json({
      requests: rows.map((r) => ({
        enrollment_id: r.enrollment_id,
        user_id: r.user_id,
        course_id: r.course_id,
        status: r.status,
        requested_at: r.requested_at,
        reviewed_at: r.reviewed_at,
        remarks: r.remarks || '',
        user_name: r.user_name,
        user_email: r.user_email,
        course_name: r.course_name,
        start_date: r.start_date ? String(r.start_date).slice(0, 10) : null,
        end_date: r.end_date ? String(r.end_date).slice(0, 10) : null,
        total_contact_hours: Number(r.total_contact_hours) || 0,
        reviewed_by_name: r.reviewed_by_name || null,
      })),
    })
  } catch (error) {
    res.status(500).json({
      message: 'Unable to load enrollment requests.',
      error: error.message,
    })
  }
})

app.patch('/api/enrollments/:id', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const enrollmentId = Number(req.params.id)
    const decision = String(req.body.status || '').toLowerCase()
    const remarks = req.body.remarks ? String(req.body.remarks).trim() : null
    const reviewerId = req.body.reviewerId ? Number(req.body.reviewerId) : null
    if (!enrollmentId || !['approved', 'declined'].includes(decision)) {
      return res.status(400).json({ message: 'status must be approved or declined.' })
    }

    await connection.beginTransaction()
    const [rows] = await connection.query(
      `SELECT ce.enrollment_id, ce.user_id, ce.course_id, c.course_name
       FROM course_enrollments ce
       INNER JOIN courses c ON c.course_id = ce.course_id
       WHERE ce.enrollment_id = ? FOR UPDATE`,
      [enrollmentId]
    )
    if (!rows.length) {
      await connection.rollback()
      return res.status(404).json({ message: 'Enrollment request not found.' })
    }
    const enrollment = rows[0]

    await connection.query(
      `UPDATE course_enrollments
       SET status = ?, reviewed_at = NOW(), reviewed_by = ?, remarks = ?
       WHERE enrollment_id = ?`,
      [decision, reviewerId, remarks, enrollmentId]
    )

    const noteTitle = decision === 'approved' ? 'Course registration approved' : 'Course registration declined'
    const noteMessage =
      decision === 'approved'
        ? `Your registration for ${enrollment.course_name} has been approved. You can now access this course modules.`
        : `Your registration for ${enrollment.course_name} was declined. You may re-apply from My Modules.`

    await connection.query(
      `INSERT INTO notifications (user_id, title, type, message, is_read)
       VALUES (?, ?, 'enrollment', ?, FALSE)`,
      [enrollment.user_id, noteTitle, noteMessage]
    )

    await connection.commit()
    res.json({ success: true, enrollment_id: enrollmentId, status: decision })
  } catch (error) {
    try { await connection.rollback() } catch {}
    res.status(500).json({
      message: 'Unable to update enrollment request.',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})

app.post('/api/modules/:moduleId/media', upload.single('file'), async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId)
    if (!moduleId) return res.status(400).json({ message: 'Invalid module id.' })
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' })
    const [rows] = await pool.query('SELECT module_id FROM training_modules WHERE module_id = ?', [moduleId])
    if (!rows.length) return res.status(404).json({ message: 'Module not found.' })

    const urlPath = `/uploads/module-media/${req.file.filename}`
    const mime = String(req.file.mimetype || '').toLowerCase()
    const mediaType = mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : 'file'
    res.status(201).json({
      success: true,
      moduleId,
      media_url: urlPath,
      media_type: mediaType,
      original_name: req.file.originalname,
    })
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.', error: error.message })
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
  const connection = await pool.getConnection()
  try {
    const { courseId } = req.params
    await connection.beginTransaction()
    const [modules] = await connection.query(
      'SELECT module_id FROM training_modules WHERE course_id = ?',
      [courseId]
    )
    for (const moduleRow of modules) {
      await clearModuleContent(moduleRow.module_id, connection)
    }
    await connection.query('DELETE FROM training_modules WHERE course_id = ?', [courseId])
    const [result] = await connection.query('DELETE FROM courses WHERE course_id = ?', [courseId])

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Course not found.',
      })
    }
    await connection.commit()

    res.json({
      message: 'Course deleted successfully.',
    })
  } catch (error) {
    try { await connection.rollback() } catch {}
    res.status(500).json({
      message: 'Unable to delete course.',
      error: error.message,
    })
  } finally {
    connection.release()
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

    const total = result.length
    const resource = 'students'
    const rangeHeader = req.get('range') || ''
    const rangeMatch = new RegExp(`^${resource}=(\\d+)-(\\d+)$`).exec(rangeHeader)
    // react-admin simple-rest sends Range; custom UI uses ?parkId= only — return full array in that case
    if (!rangeMatch) {
      res.json(result)
      return
    }
    const start = Number(rangeMatch[1])
    const endReq = Number(rangeMatch[2])
    if (total === 0) {
      res.setHeader('Content-Range', `${resource} */0`)
      res.json([])
      return
    }
    if (start >= total) {
      res.setHeader('Content-Range', `${resource} */${total}`)
      res.json([])
      return
    }
    const end = Math.min(endReq, total - 1)
    const slice = result.slice(start, end + 1)
    const lastIdx = start + slice.length - 1
    res.setHeader('Content-Range', `${resource} ${start}-${lastIdx}/${total}`)
    res.json(slice)
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

// ---------------------- Mobile app APIs (DB-backed content) ----------------------
app.get('/api/mobile/courses', async (req, res) => {
  try {
    const userId = Number(req.query.userId)
    if (!userId) return res.status(400).json({ error: 'userId is required' })

    const [rows] = await pool.query(
      `SELECT
         c.course_id,
         c.course_name,
         c.description,
         DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
         c.total_contact_hours,
         IFNULL(ce.status, 'none') AS enrollment_status,
         ce.requested_at,
         ce.reviewed_at,
         ce.remarks,
         COUNT(tm.module_id) AS module_count
       FROM courses c
       LEFT JOIN course_enrollments ce
         ON ce.course_id = c.course_id AND ce.user_id = ?
       LEFT JOIN training_modules tm
         ON tm.course_id = c.course_id
       GROUP BY
         c.course_id, c.course_name, c.description, c.start_date, c.end_date, c.total_contact_hours,
         ce.status, ce.requested_at, ce.reviewed_at, ce.remarks
       ORDER BY c.created_at DESC`,
      [userId]
    )

    res.json({
      courses: rows.map((r) => ({
        course_id: r.course_id,
        course_name: r.course_name,
        description: r.description || '',
        start_date: r.start_date,
        end_date: r.end_date,
        total_contact_hours: Number(r.total_contact_hours) || 0,
        enrollment_status: r.enrollment_status || 'none',
        can_access: r.enrollment_status === 'approved',
        requested_at: r.requested_at,
        reviewed_at: r.reviewed_at,
        remarks: r.remarks || '',
        module_count: Number(r.module_count) || 0,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/mobile/courses/:courseId/register', async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = Number(req.body.userId)
    if (!userId) return res.status(400).json({ error: 'userId is required' })

    const [courseRows] = await pool.query('SELECT course_id, course_name FROM courses WHERE course_id = ?', [courseId])
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' })

    await pool.query(
      `INSERT INTO course_enrollments (user_id, course_id, status, requested_at, reviewed_at, reviewed_by, remarks)
       VALUES (?, ?, 'pending', NOW(), NULL, NULL, NULL)
       ON DUPLICATE KEY UPDATE
         status = 'pending',
         requested_at = NOW(),
         reviewed_at = NULL,
         reviewed_by = NULL,
         remarks = NULL`,
      [userId, courseId]
    )

    res.status(201).json({
      success: true,
      course_id: courseId,
      status: 'pending',
      message: `Registration request submitted for ${courseRows[0].course_name}.`,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/mobile/modules", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const [moduleRows] = await pool.query(
      `SELECT tm.module_id, tm.course_id, tm.title, tm.description, tm.category, tm.park, tm.level, tm.duration,
              tm.objectives, IFNULL(p.progress_percent, 0) AS progress_percent,
              IFNULL(p.completed_lessons, '') AS completed_lessons,
              IFNULL(p.quiz_score, 0) AS quiz_score,
              IFNULL(p.quiz_passed, 0) AS quiz_passed
       FROM training_modules tm
       LEFT JOIN course_enrollments ce
         ON ce.course_id = tm.course_id AND ce.user_id = ?
       LEFT JOIN progress p ON tm.module_id = p.module_id AND p.user_id = ?
       WHERE tm.course_id IS NULL OR ce.status = 'approved'
       ORDER BY tm.module_id`,
      [userId, userId]
    );
    const moduleIds = moduleRows.map((r) => r.module_id);

    const [lessonRows] = moduleIds.length
      ? await pool.query(
          `SELECT lesson_id, module_id, title, content, media_url, lesson_type, sort_order
           FROM lessons
           WHERE module_id IN (?)
           ORDER BY module_id, sort_order ASC, lesson_id ASC`,
          [moduleIds]
        )
      : [[]];

    const [quizRows] = moduleIds.length
      ? await pool.query(
          `SELECT q.quiz_id, q.module_id, q.title, q.sort_order AS quiz_order,
                  qs.question_id, qs.question_text, qs.sort_order AS question_order,
                  o.option_id, o.option_text, o.is_correct, o.sort_order AS option_order
           FROM quizzes q
           LEFT JOIN questions qs ON q.quiz_id = qs.quiz_id
           LEFT JOIN options o ON o.question_id = qs.question_id
           WHERE q.module_id IN (?)
           ORDER BY q.module_id, q.sort_order ASC, q.quiz_id ASC, qs.sort_order ASC, qs.question_id ASC, o.sort_order ASC, o.option_id ASC`,
          [moduleIds]
        )
      : [[]];

    const lessonsByModule = new Map();
    const blocksByModule = new Map();
    moduleIds.forEach((id) => {
      lessonsByModule.set(id, []);
      blocksByModule.set(id, []);
    });

    lessonRows.forEach((l) => {
      const lessonType = l.lesson_type || "text";
      const title = l.title || (lessonType === "text" ? "Lesson" : lessonType === "video" ? "Video" : "Image");
      const content = l.content || "";
      const block = {
        id: `lesson-${l.lesson_id}`,
        type: lessonType,
        title,
        content: lessonType === "text" ? content : "",
        caption: lessonType === "text" ? "" : content,
        media_url: l.media_url || "",
        _sort: Number(l.sort_order) || 0,
      };
      const list = blocksByModule.get(l.module_id);
      if (list) list.push(block);
      if (lessonType === "text") {
        const lessonList = lessonsByModule.get(l.module_id) || [];
        lessonList.push(title);
        lessonsByModule.set(l.module_id, lessonList);
      } else {
        const lessonList = lessonsByModule.get(l.module_id) || [];
        lessonList.push(`${lessonType === "video" ? "Video" : "Image"}: ${title}`);
        lessonsByModule.set(l.module_id, lessonList);
      }
    });

    const quizByModule = new Map();
    const quizBuildMap = new Map();
    quizRows.forEach((r) => {
      if (!r.quiz_id) return;
      const quizKey = `${r.module_id}:${r.quiz_id}`;
      if (!quizBuildMap.has(quizKey)) {
        const quizBlock = {
          id: `quiz-${r.quiz_id}`,
          type: "quiz",
          title: r.title || "Quiz",
          questions: [],
          _sort: Number(r.quiz_order) || 0,
          _qMap: new Map(),
        };
        quizBuildMap.set(quizKey, quizBlock);
        const list = blocksByModule.get(r.module_id);
        if (list) list.push(quizBlock);
      }
      const quizBlock = quizBuildMap.get(quizKey);
      if (!r.question_id) return;
      if (!quizBlock._qMap.has(r.question_id)) {
        const qItem = {
          questionId: r.question_id,
          question: r.question_text || "",
          options: [],
          answerIndex: -1,
          _order: Number(r.question_order) || 0,
        };
        quizBlock._qMap.set(r.question_id, qItem);
        quizBlock.questions.push(qItem);
      }
      const q = quizBlock._qMap.get(r.question_id);
      if (r.option_id) {
        q.options.push(r.option_text || "");
        if (Number(r.is_correct) === 1) q.answerIndex = q.options.length - 1;
      }
    });

    quizBuildMap.forEach((quizBlock, key) => {
      const moduleId = Number(key.split(":")[0]);
      delete quizBlock._qMap;
      quizBlock.questions = quizBlock.questions
        .sort((a, b) => (a._order || 0) - (b._order || 0))
        .map((q) => {
          const out = { ...q };
          delete out._order;
          return out;
        });
      if (!quizByModule.has(moduleId)) quizByModule.set(moduleId, []);
      quizByModule.get(moduleId).push(...quizBlock.questions);
    });

    const modules = moduleRows.map((m) => ({
      id: m.module_id,
      course_id: m.course_id || null,
      title: m.title,
      subtitle: m.description || "",
      category: m.category || "General",
      park: m.park || "",
      duration: m.duration || "-",
      level: m.level || "Beginner",
      progress: Number(m.progress_percent) || 0,
      completedLessons: String(m.completed_lessons || "")
        .split(",")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n >= 0),
      savedQuizScore: Number(m.quiz_score) || 0,
      savedQuizPassed: Boolean(Number(m.quiz_passed)),
      objectives: (() => {
        try {
          const arr = m.objectives ? JSON.parse(m.objectives) : [];
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      })(),
      lessons: lessonsByModule.get(m.module_id) || [],
      quiz: quizByModule.get(m.module_id) || [],
      contentBlocks: (blocksByModule.get(m.module_id) || [])
        .sort((a, b) => (a._sort || 0) - (b._sort || 0))
        .map((b) => {
          const out = { ...b }
          delete out._sort
          return out
        }),
    }));

    res.json({ modules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/mobile/progress/:moduleId", async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const userId = Number(req.body.userId);
    if (!moduleId || !userId) return res.status(400).json({ error: "userId and moduleId are required" });

    const progressPercent = Math.max(0, Math.min(100, Number(req.body.progressPercent) || 0));
    const completedLessons = Array.isArray(req.body.completedLessons) ? req.body.completedLessons.join(",") : "";
    const quizScore = Math.max(0, Math.min(100, Number(req.body.quizScore) || 0));
    const quizPassed = Boolean(req.body.quizPassed);
    const status = req.body.status || (progressPercent >= 100 ? "completed" : progressPercent > 0 ? "in_progress" : "not_started");

    await pool.query(
      `INSERT INTO progress (user_id, module_id, progress_percent, completed_lessons, quiz_passed, quiz_score, status, completion_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         progress_percent = VALUES(progress_percent),
         completed_lessons = VALUES(completed_lessons),
         quiz_passed = VALUES(quiz_passed),
         quiz_score = VALUES(quiz_score),
         status = VALUES(status),
         completion_date = VALUES(completion_date)`,
      [userId, moduleId, progressPercent, completedLessons, quizPassed, quizScore, status, progressPercent >= 100 ? new Date() : null]
    );

    res.json({ success: true, progressPercent, quizScore, quizPassed, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mobile/certificates/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT tm.module_id, tm.title, IFNULL(p.progress_percent, 0) AS progress_percent,
              c.cert_id, c.certificate_code, c.issue_date, c.expiry_date
       FROM training_modules tm
       LEFT JOIN progress p ON p.module_id = tm.module_id AND p.user_id = ?
       LEFT JOIN certifications c ON c.module_id = tm.module_id AND c.user_id = ?
       ORDER BY tm.module_id`,
      [userId, userId]
    );
    const certificates = rows.map((r) => ({
      moduleId: r.module_id,
      title: r.title,
      progress: Number(r.progress_percent) || 0,
      unlocked: (Number(r.progress_percent) || 0) >= 100,
      certId: r.cert_id || null,
      certificateCode: r.certificate_code || null,
      issueDate: r.issue_date || null,
      expiryDate: r.expiry_date || null,
    }));
    res.json({ certificates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mobile/notifications/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT notification_id, title, type, message, is_read
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({
      notifications: rows.map((r) => ({
        id: r.notification_id,
        title: r.title,
        type: r.type || "training",
        body: r.message || "",
        read: Boolean(r.is_read),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/mobile/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const read = req.body.read === undefined ? true : Boolean(req.body.read);
    await pool.query("UPDATE notifications SET is_read = ? WHERE notification_id = ?", [read, id]);
    res.json({ success: true, id, read });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/mobile/notifications/read-all/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mobile/schedule/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT schedule_id, date, title, location, type
       FROM schedule
       WHERE user_id = ?
       ORDER BY date ASC, schedule_id DESC`,
      [userId]
    );
    res.json({
      scheduleItems: rows.map((r) => ({
        id: r.schedule_id,
        date: r.date ? String(r.date).slice(0, 10) : "",
        title: r.title,
        location: r.location || "Self-paced",
        type: r.type || "Reminder",
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/mobile/schedule", async (req, res) => {
  try {
    const { userId, moduleId, date, title, location, type } = req.body;
    if (!userId || !date || !title) return res.status(400).json({ error: "userId, date and title are required" });
    const [ret] = await pool.query(
      `INSERT INTO schedule (user_id, module_id, date, title, location, type, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [Number(userId), moduleId ? Number(moduleId) : null, date, title, location || "Self-paced", type || "Reminder"]
    );
    res.status(201).json({ id: ret.insertId, date, title, location: location || "Self-paced", type: type || "Reminder" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/mobile/schedule/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date, title, location, type } = req.body;
    await pool.query(
      `UPDATE schedule
       SET date = ?, title = ?, location = ?, type = ?
       WHERE schedule_id = ?`,
      [date, title, location || "Self-paced", type || "Reminder", id]
    );
    res.json({ success: true, id, date, title, location: location || "Self-paced", type: type || "Reminder" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/mobile/schedule/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM schedule WHERE schedule_id = ?", [id]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mobile/profile/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.email, p.park_name, gp.guide_id, gp.phone, gp.birthday, gp.address, ua.stored_name
       FROM users u
       LEFT JOIN parks p ON p.park_id = u.park_id
       LEFT JOIN guide_profiles gp ON gp.user_id = u.user_id
       LEFT JOIN user_avatars ua ON ua.user_id = u.user_id
       WHERE u.user_id = ?`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    const r = rows[0];
    res.json({
      profile: {
        fullName: r.name || "",
        email: r.email || "",
        assignedPark: r.park_name || "",
        parkGuideId: r.guide_id ? `PG-${String(r.guide_id).padStart(4, "0")}` : "",
        phoneNumber: r.phone || "",
        birthday: r.birthday ? String(r.birthday).slice(0, 10) : "",
        address: r.address || "",
        imageUri: r.stored_name ? `${req.protocol}://${req.get("host")}/uploads/${r.stored_name}` : "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/mobile/profile/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { fullName, email, assignedPark, phoneNumber, birthday, address } = req.body;

    const [parkRows] = assignedPark
      ? await pool.query("SELECT park_id FROM parks WHERE park_name = ? LIMIT 1", [assignedPark])
      : [[]];
    const parkId = parkRows.length ? parkRows[0].park_id : null;

    await pool.query("UPDATE users SET name = ?, email = ?, park_id = COALESCE(?, park_id) WHERE user_id = ?", [fullName, email, parkId, userId]);
    await pool.query(
      `INSERT INTO guide_profiles (guide_id, user_id, phone, address, birthday, status)
       VALUES (?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE phone = VALUES(phone), address = VALUES(address), birthday = VALUES(birthday)`,
      [userId, userId, phoneNumber || null, address || null, birthday || null]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = Number(process.env.PORT) || 4001

ensureAdminSchema(pool)
  .then(() => {
    app.listen(port, () => {
      console.log(`Admin database server running on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('[admin schema] migration failed:', err)
    process.exit(1)
  })

