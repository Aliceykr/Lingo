const mysql = require('mysql2/promise');
const https = require('https');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'wordbooks',
  charset: 'utf8mb4'
});

function fetchWordlist() {
  return new Promise((resolve, reject) => {
    https.get('https://raw.githubusercontent.com/mahavivo/english-wordlists/master/CET4_edited.txt', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseLine(line) {
  const match = line.match(/^([a-zA-Z][a-zA-Z\-]*)\s+(?:\[.*?\]\s+)?(.+)$/);
  if (!match) return null;
  return { word: match[1], translation: match[2].trim() };
}

async function main() {
  console.log('下载词汇表...');
  const text = await fetchWordlist();
  const lines = text.split('\n');

  const words = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('大学') || trimmed.startsWith('(共') || trimmed.length <= 1) continue;
    const parsed = parseLine(trimmed);
    if (parsed) words.push(parsed);
  }

  console.log(`解析到 ${words.length} 个单词，开始导入...`);

  const connection = await pool.getConnection();
  const [wbs] = await connection.query("SELECT id FROM wordbooks WHERE name = 'CET-4' LIMIT 1");
  if (wbs.length === 0) {
    console.error('找不到 CET-4 单词本');
    process.exit(1);
  }
  const wordbookId = wbs[0].id;
  console.log(`使用 wordbook_id = ${wordbookId}`);

  await connection.query('DELETE FROM words WHERE wordbook_id = ?', [wordbookId]);

  const values = words.map(w => [wordbookId, w.word, w.translation]);
  await connection.query('INSERT INTO words (wordbook_id, word, translation) VALUES ?', [values]);
  connection.release();

  console.log(`成功导入 ${words.length} 个单词！`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
