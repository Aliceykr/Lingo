// 导入必要的模块
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

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
  queueLimit: 0
});

// API路由定义

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

// 创建新的单词本
app.post('/api/wordbooks', async (req, res) => {
  try {
    const { name, description } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO wordbooks (name, description) VALUES (?, ?)',
      [name, description]
    );
    connection.release();
    res.status(201).json({ message: 'Wordbook created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据ID获取单个单词本
app.get('/api/wordbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM wordbooks WHERE id = ?', [id]);
    connection.release();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Wordbook not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新指定ID的单词本信息
app.put('/api/wordbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE wordbooks SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    connection.release();
    res.json({ message: 'Wordbook updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除指定ID的单词本
app.delete('/api/wordbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM wordbooks WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Wordbook deleted successfully' });
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