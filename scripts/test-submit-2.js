const http = require('http');

function requestJson(method, path, token, payload) {
  return new Promise((resolve, reject) => {
    const postData = payload ? JSON.stringify(payload) : null;
    const opts = {
      method,
      host: 'localhost',
      port: 3000,
      path,
      headers: Object.assign(
        {
          Authorization: `Bearer ${token}`
        },
        postData ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {}
      )
    };
    const req = http.request(opts, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); } catch (e) { resolve({ status: res.statusCode, body: b }); }
      });
    });
    req.on('error', e => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    const challengeId = '692798d352afd27eaa3528de';
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTI3OTQ3MjUyYWZkMjdlYWEzNTI4YzEiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IkFkbWluaXMiLCJsYXN0TmFtZSI6IlRyYWRvciIsInJvbGUiOiJBRE1JTiIsImlzQWN0aXZlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI1LTExLTI2VDIzOjU5OjQ2Ljc5NVoiLCJ1cGRhdGVkQXQiOiIyMDI1LTExLTI2VDIzOjU5OjQ2Ljc5NVoiLCJpYXQiOjE3NjQyMDI4OTMsImV4cCI6MTc2NDI4OTI5M30.542wGG78qzxhKnIkURrOmUxEUtiyNuoGZqBg4VDfu8E';
    const studentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTI3OTNlNDUyYWZkMjdlYWEzNTI4YmIiLCJlbWFpbCI6ImFnaWxjYXJjYW1vQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IkFuYSIsImxhc3ROYW1lIjoiR2lsIiwicm9sZSI6IlNUVURFTlQiLCJpc0FjdGl2ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNS0xMS0yNlQyMzo1NzoyNC42MDFaIiwidXBkYXRlZEF0IjoiMjAyNS0xMS0yNlQyMzo1NzoyNC42MDFaIiwiaWF0IjoxNzY0MjAyODA4LCJleHAiOjE3NjQyODkyMDh9.PwY5fVUGrbBq7kDOEOELBbkYqOH_8uJh2mma0RXJbKk';

    console.log('Updating challenge status to published...');
    const upd = await requestJson('PUT', `/api/challenges/${challengeId}`, adminToken, { status: 'published' });
    console.log('Update response:', upd);

    console.log('Posting submission...');
    const payload = {
      challengeId,
      courseId: 'course-1764202144340',
      language: 'javascript',
      code: 'function twoSum(nums, target) { for(let i=0;i<nums.length;i++){for(let j=i+1;j<nums.length;j++){if(nums[i]+nums[j]===target) return [i,j];}} }'
    };
    const res = await requestJson('POST', '/api/submissions', studentToken, payload);
    console.log('Submission response:', res);
  } catch (e) {
    console.error('Error', e);
  }
})();
