# Metrics — What to expect and how to interpret

This document explains the fields returned by `GET /api/metrics` and how to interpret them.

- `submissions.total`: total number of recent submissions scanned (implementation may use a recent window or full DB scan).
- `submissions.by_status`: object keyed by status (e.g., `ACCEPTED`, `WRONG_ANSWER`) with counts.
- `submissions.today`: submissions created since local start of day (00:00).
- `submissions.by_language`: counts per programming language.
- `submissions.success_rate`: accepted / total.

- `challenges.total`: number of challenges.
- `challenges.by_difficulty`: counts by difficulty levels.
- `challenges.most_popular`: top-N challenges by submissions.

- `users.total`: total users. `users.by_role` groups by role.
- `users.active_today`: unique users that submitted today.

- `evaluations.active`: active evaluations count. `completed` is finished evaluations.
- `evaluations.participation_rate`: unique users who participated in evaluations / total users.

- `performance.average_execution_time`: average `timeMsTotal` across recent submissions.
- `performance.queue_wait_time`: queue waiting jobs count.
- `performance.worker_utilization`: estimated utilization = active / (active + waiting).

- `system.uptime`, `system.memory_usage`: Node process metrics.
- `system.redis_connected`: whether the job queue Redis connection seems healthy.
- `system.db_connections`: basic DB connection state.

Notes:
- For production-grade metrics, use DB aggregations and instrument job timestamps to compute precise queue wait times and percentiles.
