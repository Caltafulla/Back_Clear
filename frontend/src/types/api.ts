export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN'

export interface User {
  id: string
  email: string
  name?: string // Computed from firstName + lastName
  firstName?: string
  lastName?: string
  role: Role
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface TestCase {
  input: string
  output: string
  expectedOutput?: string // Backend uses this name
  id?: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  tags: string[]
  timeLimit: number
  memoryLimit: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'draft' | 'published' | 'archived'
  testCases?: TestCase[]
  courseId?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export type Language = 'python' | 'javascript' | 'cpp' | 'java'

export interface SubmissionTestCaseResult {
  caseId: string
  status: Submission['status']
  timeMs: number
  memoryKb: number
  actualOutput?: string
  expectedOutput?: string
  errorMessage?: string
}

export interface Submission {
  id: string
  challengeId: string
  courseId: string
  code: string
  language: Language
  status: 'QUEUED' | 'RUNNING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR'
  executionTime?: number
  memoryUsage?: number
  score?: number
  createdAt: string
  updatedAt?: string
  errorMessage?: string
  testCaseResults?: SubmissionTestCaseResult[]
}
