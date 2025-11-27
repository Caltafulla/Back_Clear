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
}

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  tags: string[]
  timeLimit: number
  memoryLimit: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  testCases?: TestCase[]
}

export type Language = 'typescript' | 'javascript'

export interface Submission {
  id: string
  code: string
  language: Language
  status: 'QUEUED' | 'RUNNING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR'
  executionTime?: number
  memoryUsage?: number
  score?: number
  createdAt: string
}
