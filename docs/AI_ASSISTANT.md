# AI Assistant — Integration Examples

Examples to integrate with the AI assistant endpoints.

1) Generate explanation for a topic

Request: `POST /api/ai/generate`
Body example:
```
{
  "topic": "recursion",
  "type": "explain",
  "examples": 2
}
```

2) Use assistant to generate test cases

Request: `POST /api/ai/generate-testcases`
Body example:
```
{
  "challengeId": "challenge-123",
  "difficulty": "Medium"
}
```

Notes:
- Authenticate requests where required.
- The assistant may return suggestions that must be validated before applying to production data.
