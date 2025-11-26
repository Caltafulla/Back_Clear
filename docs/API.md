# Swagger/OpenAPI Documentation

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Challenges
- `GET /api/challenges` - List challenges
- `POST /api/challenges` - Create challenge (ADMIN/PROFESSOR)
- `GET /api/challenges/:id` - Get challenge by ID
- `PUT /api/challenges/:id` - Update challenge
- `DELETE /api/challenges/:id` - Delete challenge
- `GET /api/challenges/search` - Search challenges

### Submissions
- `POST /api/submissions` - Submit solution
- `GET /api/submissions` - List submissions
- `GET /api/submissions/my` - Get user's submissions
- `GET /api/submissions/:id` - Get submission by ID
- `GET /api/submissions/stats` - Get submission statistics

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (ADMIN/PROFESSOR)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll student in course

### Evaluations
- `GET /api/evaluations` - List evaluations
- `POST /api/evaluations` - Create evaluation (PROFESSOR)
- `GET /api/evaluations/:id` - Get evaluation by ID
- `PUT /api/evaluations/:id` - Update evaluation
- `DELETE /api/evaluations/:id` - Delete evaluation

### Leaderboard
- `GET /api/leaderboard/challenge/:id` - Get challenge leaderboard
- `GET /api/leaderboard/course/:id` - Get course leaderboard
- `GET /api/leaderboard/evaluation/:id` - Get evaluation leaderboard

### AI Assistant
- `POST /api/ai/generate-challenges` - Generate challenge ideas
- `POST /api/ai/generate-test-cases` - Generate test cases
- `POST /api/ai/validate-test-case` - Validate test case

### System
- `GET /health` - Health check
- `GET /api/metrics` - System metrics

## Data Models

### User
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "STUDENT | ADMIN | PROFESSOR",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Challenge
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "Easy | Medium | Hard",
  "tags": ["string"],
  "timeLimit": "number",
  "memoryLimit": "number",
  "status": "draft | published | archived",
  "courseId": "string",
  "createdBy": "string",
  "testCases": [
    {
      "id": "string",
      "input": "string",
      "expectedOutput": "string",
      "isHidden": "boolean",
      "order": "number"
    }
  ],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Submission
```json
{
  "id": "string",
  "userId": "string",
  "challengeId": "string",
  "courseId": "string",
  "language": "python | javascript | cpp | java",
  "code": "string",
  "status": "QUEUED | RUNNING | ACCEPTED | WRONG_ANSWER | TIME_LIMIT_EXCEEDED | RUNTIME_ERROR | COMPILATION_ERROR",
  "score": "number",
  "timeMsTotal": "number",
  "memoryKbTotal": "number",
  "testCaseResults": [
    {
      "caseId": "string",
      "status": "string",
      "timeMs": "number",
      "memoryKb": "number",
      "actualOutput": "string",
      "expectedOutput": "string",
      "errorMessage": "string"
    }
  ],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Success Responses

All success responses follow this format:
```json
{
  "success": true,
  "data": "Response data",
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```
