# Evaluations — Usage Guide

This document explains how to create and use evaluations in the platform, and how submissions are associated with evaluations.

1. Create an evaluation

- POST `/api/evaluations` (admin/professor)
- Body: `{ name, description, courseId, challengeIds, startDate, endDate, durationMinutes, maxAttempts }`

2. How the evaluation affects submissions

- When a student submits to a `challengeId` that is part of an active evaluation, the platform will:
  - Validate that the evaluation is active and within time window.
  - Enforce `maxAttempts` per student per challenge for the evaluation.
  - Assign `evaluationId` to the `Submission` record so it can be filtered in leaderboards and reports.

3. Best practices

- Use `maxAttempts = 0` to allow unlimited attempts.
- For fairness, ensure evaluation `startDate` and `endDate` are in UTC and clearly communicated.
