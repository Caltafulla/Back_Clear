import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChallenges } from '../../services/challenges'
import { getCourses } from '../../services/courses'
import api from '../../services/api'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ChallengeManagement() {
  const qc = useQueryClient()
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['admin', 'challenges'],
    queryFn: () => getChallenges({ limit: 100 }),
  })
  const { data: courses = [] } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => getCourses({ limit: 100 }),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<any>({
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: '',
    timeLimit: 1000,
    memoryLimit: 256,
    courseId: '',
    testInput: '',
    testExpectedOutput: '',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        timeLimit: Number(form.timeLimit),
        memoryLimit: Number(form.memoryLimit),
        courseId: form.courseId,
        testCases: [
          { input: form.testInput || '1\n', expectedOutput: form.testExpectedOutput || '1\n', isHidden: false, order: 1 }
        ],
      }
      const res = await api.post('/challenges', payload)
      return res.data?.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'challenges'] })
      setShowCreate(false)
      setForm({
        title: '',
        description: '',
        difficulty: 'Easy',
        tags: '',
        timeLimit: 1000,
        memoryLimit: 256,
        courseId: '',
        testInput: '',
        testExpectedOutput: '',
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/challenges/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'challenges'] })
    }
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Manage Challenges</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Challenge</button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LoadingSpinner />
          <span>Loading challenges...</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Title</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Difficulty</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Course</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ padding: '8px 12px' }}>{c.title}</td>
                  <td style={{ padding: '8px 12px' }}>{c.difficulty}</td>
                  <td style={{ padding: '8px 12px' }}>{String(c.status)}</td>
                  <td style={{ padding: '8px 12px' }}>{c.courseId || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <a className="btn btn-sm" href={`/challenges/${c.id}`}>View</a>{' '}
                    <button className="btn btn-sm" onClick={() => deleteMutation.mutate(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{ marginTop: 16, border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Create Challenge</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Select label="Difficulty" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={['Easy','Medium','Hard']} />
            <Input label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
            <Input label="Time Limit (ms)" type="number" value={form.timeLimit} onChange={(v) => setForm({ ...form, timeLimit: v })} />
            <Input label="Memory Limit (MB)" type="number" value={form.memoryLimit} onChange={(v) => setForm({ ...form, memoryLimit: v })} />
            <Select label="Course" value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })} options={courses.map((c: any) => ({ value: c.id, label: c.name || c.title || c.id }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Textarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Textarea label="Sample Input" value={form.testInput} onChange={(v) => setForm({ ...form, testInput: v })} />
            <Textarea label="Expected Output" value={form.testExpectedOutput} onChange={(v) => setForm({ ...form, testExpectedOutput: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange((type === 'number' ? Number(e.target.value) : e.target.value))} />
    </label>
  )
}

function Textarea({ label, value, onChange }: any) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Select({ label, value, onChange, options }: any) {
  const opts = useMemo(() => {
    if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
      return (options as string[]).map(o => ({ value: o, label: o }))
    }
    return options
  }, [options])
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {opts.map((o: any) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

