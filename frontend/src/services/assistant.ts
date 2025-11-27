import api from './api'
import { requestQueue } from '../utils/requestQueue'

export type GeneratedChallengeIdea = {
  title: string
  description: string
  inputs?: string[]
  outputs?: string[]
}

export type GeneratedTestCase = {
  input: string
  expectedOutput: string
}

export async function generateChallengeIdeas(topic: string, count: number = 3): Promise<GeneratedChallengeIdea[]> {
  const res = await requestQueue.add(() =>
    api.post('/ai/generate-challenges', { topic, count })
  )
  if (res.data?.success && Array.isArray(res.data.data)) {
    return res.data.data
  }
  return []
}

export async function generateTestCases(challengeDescription: string, count: number = 5): Promise<GeneratedTestCase[]> {
  const res = await requestQueue.add(() =>
    api.post('/ai/generate-test-cases', { challengeDescription, count })
  )
  if (res.data?.success && Array.isArray(res.data.data)) {
    return res.data.data
  }
  return []
}

export async function validateTestCase(input: string, expectedOutput: string, language: 'python' | 'javascript' | 'cpp' | 'java'): Promise<boolean> {
  const res = await requestQueue.add(() =>
    api.post('/ai/validate-test-case', { input, expectedOutput, language })
  )
  if (res.data?.success && typeof res.data.data?.isValid === 'boolean') {
    return res.data.data.isValid as boolean
  }
  return false
}


