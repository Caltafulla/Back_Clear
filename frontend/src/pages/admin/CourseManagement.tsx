import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourses, createCourse, deleteCourse } from '../../services/courses'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function CourseManagement() {
  const qc = useQueryClient()
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => getCourses({ limit: 100 }),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    period: '2025-1',
    group: 1,
  })

  const createMut = useMutation({
    mutationFn: async () => createCourse({ ...form, group: Number(form.group) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      setShowCreate(false)
      setForm({ name: '', code: '', description: '', period: '2025-1', group: 1 })
    }
  })
  const deleteMut = useMutation({
    mutationFn: async (id: string) => deleteCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Manage Courses</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Course</button>
      </div>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LoadingSpinner />
          <span>Loading courses...</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Period</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Group</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ padding: '8px 12px' }}>{c.name}</td>
                  <td style={{ padding: '8px 12px' }}>{c.code}</td>
                  <td style={{ padding: '8px 12px' }}>{c.period}</td>
                  <td style={{ padding: '8px 12px' }}>{c.group}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button className="btn btn-sm" onClick={() => deleteMut.mutate(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showCreate && (
        <div style={{ marginTop: 16, border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Create Course</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="Name" value={form.name} onChange={(v: any) => setForm({ ...form, name: v })} />
            <Field label="Code" value={form.code} onChange={(v: any) => setForm({ ...form, code: v })} />
            <Field label="Period" value={form.period} onChange={(v: any) => setForm({ ...form, period: v })} />
            <Field label="Group" type="number" value={form.group} onChange={(v: any) => setForm({ ...form, group: v })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Description</span>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
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

