// 测试健康检查端点的简单脚本
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`完整响应内容:`);
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (e) => {
  console.error(`请求失败: ${e.message}`);
});

req.end();