import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvaluations, createEvaluation, deleteEvaluation } from '../../services/evaluations'
import { getCourses } from '../../services/courses'
import { getChallenges } from '../../services/challenges'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function EvaluationManagement() {
  const qc = useQueryClient()
  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['admin', 'evaluations'],
    queryFn: () => getEvaluations({ limit: 100 }),
  })
  const { data: courses = [] } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => getCourses({ limit: 100 }),
  })
  const { data: challenges = [] } = useQuery({
    queryKey: ['admin', 'challenges'],
    queryFn: () => getChallenges({ limit: 100 }),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    courseId: '',
    challengeIds: [] as string[],
    startDate: '',
    endDate: '',
    durationMinutes: 60,
    maxAttempts: 3,
  })

  const createMut = useMutation({
    mutationFn: async () =>
      createEvaluation({
        name: form.name,
        description: form.description,
        courseId: form.courseId,
        challengeIds: form.challengeIds,
        startDate: form.startDate || new Date().toISOString(),
        endDate: form.endDate || new Date(Date.now() + 3600 * 1000).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        maxAttempts: Number(form.maxAttempts),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'evaluations'] })
      setShowCreate(false)
      setForm({
        name: '',
        description: '',
        courseId: '',
        challengeIds: [],
        startDate: '',
        endDate: '',
        durationMinutes: 60,
        maxAttempts: 3,
      })
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => deleteEvaluation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'evaluations'] })
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Manage Evaluations</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Evaluation</button>
      </div>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LoadingSpinner />
          <span>Loading evaluations...</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Course</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Challenges</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Duration</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ padding: '8px 12px' }}>{e.name}</td>
                  <td style={{ padding: '8px 12px' }}>{e.courseId}</td>
                  <td style={{ padding: '8px 12px' }}>{Array.isArray(e.challengeIds) ? e.challengeIds.length : 0}</td>
                  <td style={{ padding: '8px 12px' }}>{e.durationMinutes}m</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button className="btn btn-sm" onClick={() => deleteMut.mutate(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{ marginTop: 16, border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Create Evaluation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="Name" value={form.name} onChange={(v: any) => setForm({ ...form, name: v })} />
            <Select label="Course" value={form.courseId} onChange={(v: any) => setForm({ ...form, courseId: v })} options={courses.map((c: any) => ({ value: c.id, label: c.name || c.code || c.id }))} />
            <Field label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(v: any) => setForm({ ...form, durationMinutes: v })} />
            <Field label="Max Attempts" type="number" value={form.maxAttempts} onChange={(v: any) => setForm({ ...form, maxAttempts: v })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Description</span>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Challenges</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 8 }}>
              {challenges.map((c: any) => {
                const checked = form.challengeIds.includes(c.id)
                return (
                  <label key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, challengeIds: [...form.challengeIds, c.id] })
                        } else {
                          setForm({ ...form, challengeIds: form.challengeIds.filter((id: string) => id !== c.id) })
                        }
                      }}
                    />
                    <span>{c.title}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating...' : 'Create'}
            </button>
            <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: any) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />
    </label>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

