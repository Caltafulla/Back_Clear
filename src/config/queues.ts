// src/config/queues.ts

// Nombre de la cola donde se encolan los submissions
export const SUBMISSION_QUEUE_NAME =
  process.env.SUBMISSION_QUEUE_NAME || 'submission processing';

// Nombre del tipo de job que procesa el worker
export const PROCESS_SUBMISSION_JOB = 'process-submission';

// Concurrencia por defecto del worker
export const WORKER_CONCURRENCY =
  Number(process.env.WORKER_CONCURRENCY || 5);
