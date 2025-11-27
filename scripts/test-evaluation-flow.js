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
    const courseId = 'course-1764202144340';
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTI3OTQ3MjUyYWZkMjdlYWEzNTI4YzEiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IkFkbWluaXMiLCJsYXN0TmFtZSI6IlRyYWRvciIsInJvbGUiOiJBRE1JTiIsImlzQWN0aXZlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI1LTExLTI2VDIzOjU5OjQ2Ljc5NVoiLCJ1cGRhdGVkQXQiOiIyMDI1LTExLTI2VDIzOjU5OjQ2Ljc5NVoiLCJpYXQiOjE3NjQyMDI4OTMsImV4cCI6MTc2NDI4OTI5M30.542wGG78qzxhKnIkURrOmUxEUtiyNuoGZqBg4VDfu8E';
    const studentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTI3OTNlNDUyYWZkMjdlYWEzNTI4YmIiLCJlbWFpbCI6ImFnaWxjYXJjYW1vQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IkFuYSIsImxhc3ROYW1lIjoiR2lsIiwicm9sZSI6IlNUVURFTlQiLCJpc0FjdGl2ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNS0xMS0yNlQyMzo1NzoyNC42MDFaIiwidXBkYXRlZEF0IjoiMjAyNS0xMS0yNlQyMzo1NzoyNC42MDFaIiwiaWF0IjoxNzY0MjAyODA4LCJleHAiOjE3NjQyODkyMDh9.PwY5fVUGrbBq7kDOEOELBbkYqOH_8uJh2mma0RXJbKk';

    console.log('\n=== Evaluation Integration Test ===\n');

    // Step 1: Create an evaluation
    console.log('Step 1: Creating evaluation...');
    const now = new Date();
    const startDate = new Date(now.getTime() - 60000); // 1 minute ago
    const endDate = new Date(now.getTime() + 3600000); // 1 hour from now

    const evalRes = await requestJson('POST', '/api/evaluations', adminToken, {
      name: 'Test Evaluation',
      description: 'Integration test evaluation',
      courseId,
      challengeIds: [challengeId],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationMinutes: 60,
      maxAttempts: 3
    });
    console.log('Evaluation created:', evalRes.status === 201 ? '✓' : '✗');
    if (evalRes.status !== 201) {
      console.log('Error response:', evalRes.body);
      return;
    }
    const evaluationId = evalRes.body.data.id;
    console.log('Evaluation ID:', evaluationId);

    // Step 2: Update evaluation status to ACTIVE
    console.log('\nStep 2: Activating evaluation...');
    const activateRes = await requestJson('PUT', `/api/evaluations/${evaluationId}`, adminToken, {
      status: 'active'
    });
    console.log('Evaluation activated:', activateRes.status === 200 ? '✓' : '✗');

    // Step 3: Ensure challenge is published
    console.log('\nStep 3: Publishing challenge...');
    const pubRes = await requestJson('PUT', `/api/challenges/${challengeId}`, adminToken, { status: 'published' });
    console.log('Challenge published:', pubRes.status === 200 ? '✓' : '✗');

    // Step 4: Submit solution as student (should assign evaluationId)
    console.log('\nStep 4: Submitting solution within evaluation...');
    const subRes = await requestJson('POST', '/api/submissions', studentToken, {
      challengeId,
      courseId,
      language: 'javascript',
      code: 'function twoSum(nums, target) { for(let i=0;i<nums.length;i++){for(let j=i+1;j<nums.length;j++){if(nums[i]+nums[j]===target) return [i,j];}} }'
    });
    console.log('Submission created:', subRes.status === 201 ? '✓' : '✗');
    if (subRes.status !== 201) {
      console.log('Error response:', subRes.body);
      return;
    }
    const submissionId = subRes.body.data.id;
    console.log('Submission ID:', submissionId);
    console.log('Evaluation ID in submission:', subRes.body.data.evaluationId);

    // Step 5: Verify submission has evaluationId set
    console.log('\nStep 5: Verifying submission has evaluationId...');
    const getSubRes = await requestJson('GET', `/api/submissions/${submissionId}`, adminToken);
    console.log('Submission retrieved:', getSubRes.status === 200 ? '✓' : '✗');
    console.log('Submission evaluationId:', getSubRes.body.data.evaluationId);
    if (getSubRes.body.data.evaluationId) {
      console.log('✓ evaluationId correctly assigned to submission');
    } else {
      console.log('✗ evaluationId NOT assigned to submission');
    }

    // Step 6: Try to submit more times (check attempt limit logic)
    console.log('\nStep 6: Testing attempt limit logic...');
    for (let i = 1; i <= 3; i++) {
      const attemptRes = await requestJson('POST', '/api/submissions', studentToken, {
        challengeId,
        courseId,
        language: 'javascript',
        code: `function twoSum(nums, target) { /* attempt ${i} */ return null; }`
      });
      console.log(`  Attempt ${i}: ${attemptRes.status === 201 ? '✓ Created' : '✗ Failed'}`);
      if (attemptRes.status !== 201) {
        console.log(`  Reason: ${attemptRes.body.message}`);
      }
    }

    console.log('\n=== Test Complete ===\n');
  } catch (e) {
    console.error('Test error', e);
  }
})();
