import { EventEmitter } from 'events';

// Singleton emitter for submission lifecycle events
export const submissionEvents = new EventEmitter();

export type SubmissionUpdatedHandler = (submission: any) => void;
