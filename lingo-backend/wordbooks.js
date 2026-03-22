// 导入必要的模块
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const algorithms = require('./algorithms');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'lingo-secret-key-change-in-production';

// 创建Express应用实例
const app = express();
const PORT = 3002;

// 配置中间件
// CORS中间件：允许跨域请求
app.use(cors());
// Express JSON中间件：解析JSON格式的请求体
app.use(express.json());

// 创建MySQL连接池
// 连接池可以复用数据库连接，提高性能
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'wordbooks',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// API路由定义

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
    const hashed = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: '用户名已存在' });
    }
    const [result] = await connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    connection.release();
    const token = jwt.sign({ user_id: result.insertId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user_id: result.insertId, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    connection.release();
    if (rows.length === 0) return res.status(401).json({ error: '用户名或密码错误' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' });
    const token = jwt.sign({ user_id: rows[0].id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user_id: rows[0].id, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JWT 鉴权中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供 token' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'token 无效或已过期' });
  }
}

// 健康检查路由 - 测试数据库连接状态
app.get('/api/health', async (req, res) => {
  console.log('健康检查API被调用了！'); // 调试信息
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    // 获取更多系统信息
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 'Database connected successfully - ENHANCED VERSION',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)} seconds`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
      },
      database: {
        host: 'localhost',
        database: 'wordbooks',
        connectionPool: 'active'
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'Service unhealthy',
      error: 'Database connection failed',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取所有单词本列表
app.get('/api/wordbooks', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM wordbooks');
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取指定单词本的所有单词
app.get('/api/wordbooks/:id/words', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM words WHERE wordbook_id = ?', [id]);
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取待学习/复习的单词
// GET /api/wordbooks/:id/study?algorithm=&limit=20
app.get('/api/wordbooks/:id/study', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { algorithm = 'sm2', limit = 20 } = req.query;
    const user_id = req.user.user_id;

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT w.*, wp.next_review_at, wp.review_count, wp.leitner_box
       FROM words w
       LEFT JOIN word_progress wp ON w.id = wp.word_id AND wp.user_id = ? AND wp.algorithm = ?
       WHERE w.wordbook_id = ?
         AND (wp.next_review_at IS NULL OR wp.next_review_at <= NOW())
       ORDER BY wp.next_review_at ASC, w.id ASC
       LIMIT ?`,
      [user_id, algorithm, id, parseInt(limit)]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 提交学习结果
// POST /api/words/:id/review
// body: { algorithm, quality }
app.post('/api/words/:id/review', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { algorithm = 'sm2', quality } = req.body;
    const user_id = req.user.user_id;
    if (quality === undefined) return res.status(400).json({ error: 'quality is required' });
    if (quality < 0 || quality > 5) return res.status(400).json({ error: 'quality must be 0-5' });

    const connection = await pool.getConnection();
    const [existing] = await connection.query(
      'SELECT * FROM word_progress WHERE user_id = ? AND word_id = ? AND algorithm = ?',
      [user_id, id, algorithm]
    );
    const progress = existing[0] || {};
    const result = algorithms.calculate(algorithm, progress, quality);

    await connection.query(
      `INSERT INTO word_progress (user_id, word_id, algorithm, review_count, last_review_at, next_review_at, ease_factor, interval_days, stability, difficulty, leitner_box)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         review_count = VALUES(review_count),
         last_review_at = NOW(),
         next_review_at = VALUES(next_review_at),
         ease_factor = VALUES(ease_factor),
         interval_days = VALUES(interval_days),
         stability = VALUES(stability),
         difficulty = VALUES(difficulty),
         leitner_box = VALUES(leitner_box)`,
      [user_id, id, algorithm, result.review_count, result.next_review_at,
       result.ease_factor ?? progress.ease_factor ?? 2.5,
       result.interval_days,
       result.stability ?? progress.stability ?? 1.0,
       result.difficulty ?? progress.difficulty ?? 5.0,
       result.leitner_box ?? progress.leitner_box ?? 1]
    );

    // 记录每次复习日志（每次都插入新行）
    await connection.query(
      `INSERT IGNORE INTO review_log (user_id, word_id, algorithm, quality, reviewed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id, id, algorithm, quality]
    ).catch(() => {}); // review_log 表不存在时静默失败

    connection.release();
    res.json({ next_review_at: result.next_review_at, interval_days: result.interval_days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 今日学习统计（学习词数 + 复习词数）
// GET /api/stats/today
app.get('/api/stats/today', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const connection = await pool.getConnection();

    // 今日复习总词数
    const [reviewedRows] = await connection.query(
      `SELECT COUNT(DISTINCT word_id) as reviewed
       FROM word_progress
       WHERE user_id = ? AND DATE(last_review_at) = CURDATE()`,
      [user_id]
    );

    // 今日新学（review_count = 1 且今日）
    const [newRows] = await connection.query(
      `SELECT COUNT(DISTINCT word_id) as new_learned
       FROM word_progress
       WHERE user_id = ? AND review_count = 1 AND DATE(last_review_at) = CURDATE()`,
      [user_id]
    );

    connection.release();
    res.json({
      today_reviewed: reviewedRows[0].reviewed,
      today_new: newRows[0].new_learned
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 今日错误最多的单词（quality 低的）
// GET /api/stats/hard-words
app.get('/api/stats/hard-words', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const connection = await pool.getConnection();

    // 用 review_log 表查今日 quality <= 2 的单词，按出现次数排序
    let rows = [];
    try {
      const [logRows] = await connection.query(
        `SELECT w.word, w.translation, COUNT(*) as error_count
         FROM review_log rl
         JOIN words w ON rl.word_id = w.id
         WHERE rl.user_id = ? AND rl.quality <= 2 AND DATE(rl.reviewed_at) = CURDATE()
         GROUP BY rl.word_id
         ORDER BY error_count DESC
         LIMIT 3`,
        [user_id]
      );
      rows = logRows;
    } catch (e) {
      rows = [];
    }

    // 降级：用今日复习过的单词中 ease_factor 最低的
    if (!rows || rows.length === 0) {
      const [fallback] = await connection.query(
        `SELECT w.word, w.translation, wp.ease_factor
         FROM word_progress wp
         JOIN words w ON wp.word_id = w.id
         WHERE wp.user_id = ? AND DATE(wp.last_review_at) = CURDATE()
         ORDER BY wp.ease_factor ASC
         LIMIT 3`,
        [user_id]
      );
      connection.release();
      return res.json(fallback || []);
    }

    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 搜索单词
// GET /api/words/search?q=&wordbook_id=
app.get('/api/words/search', async (req, res) => {
  try {
    const { q, wordbook_id } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });
    const connection = await pool.getConnection();
    const like = `%${q}%`;
    let sql = 'SELECT * FROM words WHERE (word LIKE ? OR translation LIKE ?)';
    const params = [like, like];
    if (wordbook_id) { sql += ' AND wordbook_id = ?'; params.push(wordbook_id); }
    sql += ' LIMIT 50';
    const [rows] = await connection.query(sql, params);
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 学习统计
// GET /api/stats?wordbook_id=
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { wordbook_id } = req.query;
    const connection = await pool.getConnection();

    const wbFilter = wordbook_id ? 'AND w.wordbook_id = ?' : '';
    const wbParam = wordbook_id ? [user_id, wordbook_id] : [user_id];

    // 总学习单词数
    const [totalRows] = await connection.query(
      `SELECT COUNT(DISTINCT word_id) as total FROM word_progress WHERE user_id = ?`,
      [user_id]
    );

    // 今日已学（今天有 last_review_at 记录的）
    const [todayRows] = await connection.query(
      `SELECT COUNT(DISTINCT wp.word_id) as today
       FROM word_progress wp
       JOIN words w ON wp.word_id = w.id
       WHERE wp.user_id = ? ${wbFilter}
         AND DATE(wp.last_review_at) = CURDATE()`,
      wbParam
    );

    // 今日待复习数
    const [dueRows] = await connection.query(
      `SELECT COUNT(DISTINCT wp.word_id) as due
       FROM word_progress wp
       JOIN words w ON wp.word_id = w.id
       WHERE wp.user_id = ? ${wbFilter}
         AND wp.next_review_at <= NOW()`,
      wbParam
    );

    // 各算法正确率（quality >= 3 为正确）
    const [accuracyRows] = await connection.query(
      `SELECT algorithm,
         SUM(CASE WHEN review_count > 0 THEN 1 ELSE 0 END) as learned,
         COUNT(*) as total
       FROM word_progress wp
       JOIN words w ON wp.word_id = w.id
       WHERE wp.user_id = ? ${wbFilter}
       GROUP BY algorithm`,
      wbParam
    );

    // 连续打卡天数
    const [streakRows] = await connection.query(
      `SELECT COUNT(DISTINCT DATE(last_review_at)) as streak
       FROM word_progress
       WHERE user_id = ?
         AND last_review_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [user_id]
    );

    // 平均复习间隔（掌握程度指标）
    const [intervalRows] = await connection.query(
      `SELECT ROUND(AVG(interval_days), 1) as avg_interval
       FROM word_progress
       WHERE user_id = ? AND interval_days > 0`,
      [user_id]
    );

    connection.release();
    res.json({
      total_learned: totalRows[0].total,
      today_reviewed: todayRows[0].today,
      due_for_review: dueRows[0].due,
      streak_days: streakRows[0].streak,
      by_algorithm: accuracyRows,
      avg_interval: intervalRows[0].avg_interval ?? 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动Express服务器
console.log('正在启动服务器...');
console.log('加载的健康检查代码版本: 增强版');
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('所有API端点已加载');
});