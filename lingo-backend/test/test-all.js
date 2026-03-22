// 测试所有 API 功能
const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { hostname: 'localhost', port: 3002, path, method, headers };
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  let pass = 0, fail = 0;
  function check(name, condition, detail) {
    if (condition) { console.log(`  ✓ ${name}`); pass++; }
    else { console.log(`  ✗ ${name}: ${detail}`); fail++; }
  }

  console.log('\n=== 健康检查 ===');
  const health = await request('GET', '/api/health');
  check('返回200', health.status === 200, health.status);
  check('数据库连接', health.body.status.includes('connected'), health.body.status);

  console.log('\n=== 注册 ===');
  const reg = await request('POST', '/api/auth/register', { username: 'testuser_' + Date.now(), password: '123456' });
  check('注册成功', reg.status === 201, JSON.stringify(reg.body));
  check('返回token', !!reg.body.token, '缺失');
  const token = reg.body.token;

  console.log('\n=== 登录 ===');
  const login = await request('POST', '/api/auth/login', { username: reg.body.username, password: '123456' });
  check('登录成功', login.status === 200, JSON.stringify(login.body));
  check('返回token', !!login.body.token, '缺失');

  console.log('\n=== 单词本列表 ===');
  const wbs = await request('GET', '/api/wordbooks');
  check('返回200', wbs.status === 200, wbs.status);
  check('有数据', wbs.body.length > 0, '空数组');
  console.log(`  单词本: ${wbs.body.map(w => w.name).join(', ')}`);

  console.log('\n=== 单词列表 ===');
  const words = await request('GET', '/api/wordbooks/3/words');
  check('返回200', words.status === 200, words.status);
  check('CET-4有单词', words.body.length > 100, `只有${words.body.length}个`);

  console.log('\n=== 学习API (需要token) ===');
  const noToken = await request('GET', '/api/wordbooks/3/study?algorithm=sm2&limit=3');
  check('无token返回401', noToken.status === 401, noToken.status);

  const study = await request('GET', '/api/wordbooks/3/study?algorithm=sm2&limit=3', null, token);
  check('有token返回200', study.status === 200, JSON.stringify(study.body));
  check('返回单词', study.body.length > 0, '空数组');
  console.log(`  待学单词: ${study.body.slice(0,3).map(w => w.word).join(', ')}`);

  console.log('\n=== 提交学习结果 (需要token) ===');
  const wordId = study.body[0]?.id;
  for (const algo of ['sm2', 'ebbinghaus', 'fsrs', 'leitner']) {
    const r = await request('POST', `/api/words/${wordId}/review`, { algorithm: algo, quality: 4 }, token);
    check(`${algo} 提交成功`, r.status === 200, JSON.stringify(r.body));
  }

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
}

run().catch(console.error);
