import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourses, createCourse, updateCourse, deleteCourse, enrollStudentByEmail } from '../../services/courses'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/CourseManagement.module.css'

export default function CourseManagement() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState<string>('')
  const [enrollEmail, setEnrollEmail] = useState<string>('')

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => getCourses({ limit: 100 }),
    staleTime: 0,
  })

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    period: '2025-1',
    group: 1,
  })

  // Get unique periods for filter
  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>()
    courses.forEach((c: any) => {
      if (c.period) periods.add(c.period)
    })
    return Array.from(periods).sort().reverse()
  }, [courses])

  // Filter courses
  const filteredCourses = useMemo(() => {
    let filtered = courses

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((c: any) =>
        c.name?.toLowerCase().includes(query) ||
        c.code?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    if (periodFilter) {
      filtered = filtered.filter((c: any) => c.period === periodFilter)
    }

    return filtered
  }, [courses, searchQuery, periodFilter])

  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields according to backend schema
      if (!form.name || !form.name.trim()) {
        throw new Error('Name is required')
      }
      if (!form.code || !form.code.trim()) {
        throw new Error('Code is required')
      }
      if (!form.description || form.description.trim().length < 10) {
        throw new Error('Description is required and must be at least 10 characters')
      }
      if (!form.period || !form.period.trim()) {
        throw new Error('Period is required')
      }
      if (!form.group || form.group < 1) {
        throw new Error('Group is required and must be at least 1')
      }
      
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        period: form.period.trim(),
        group: Number(form.group),
      }
      console.log('Creating course with payload:', JSON.stringify(payload, null, 2))
      return await createCourse(payload)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      await qc.refetchQueries({ queryKey: ['admin', 'courses'] })
      await refetch()
      
      setShowCreate(false)
      setForm({
        name: '',
        code: '',
        description: '',
        period: '2025-1',
        group: 1,
      })
    },
    onError: (error: any) => {
      console.error('Failed to create course:', error)
      let errorMessage = 'Failed to create course'
      if (error?.response?.data) {
        const errorData = error.response.data
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const errorDetails = errorData.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
          errorMessage = `Validation errors:\n${errorDetails}`
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      // Build partial update payload - only include fields that are present and valid
      const payload: any = {}
      
      if (form.name && form.name.trim()) {
        payload.name = form.name.trim()
      }
      if (form.code && form.code.trim()) {
        payload.code = form.code.trim().toUpperCase()
      }
      // Description is optional in update, but if provided must be at least 10 characters
      if (form.description !== undefined && form.description.trim()) {
        if (form.description.trim().length < 10) {
          throw new Error('Description must be at least 10 characters if provided')
        }
        payload.description = form.description.trim()
      }
      if (form.period && form.period.trim()) {
        payload.period = form.period.trim()
      }
      if (form.group && form.group >= 1) {
        payload.group = Number(form.group)
      }
      
      // Ensure we have at least one field to update
      if (Object.keys(payload).length === 0) {
        throw new Error('At least one field must be provided for update')
      }
      
      console.log('Updating course:', id, JSON.stringify(payload, null, 2))
      return await updateCourse(id, payload)
    },
    onSuccess: async (_, id) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      await qc.invalidateQueries({ queryKey: ['courses'] })
      await qc.refetchQueries({ queryKey: ['admin', 'courses'] })
      await refetch()
      
      setEditingCourse(null)
      setShowCreate(false)
      setForm({
        name: '',
        code: '',
        description: '',
        period: '2025-1',
        group: 1,
      })
    },
    onError: (error: any) => {
      console.error('Failed to update course:', error)
      let errorMessage = 'Failed to update course'
      if (error?.response?.data) {
        const errorData = error.response.data
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const errorDetails = errorData.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
          errorMessage = `Validation errors:\n${errorDetails}`
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCourse(id)
    },
    onSuccess: async (_, id) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      await qc.invalidateQueries({ queryKey: ['courses'] })
      await qc.refetchQueries({ queryKey: ['admin', 'courses'] })
      await refetch()
    },
    onError: (error: any) => {
      console.error('Failed to delete course:', error)
      alert(error?.response?.data?.message || error?.message || 'Failed to delete course')
    }
  })

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!editingCourse?.id) throw new Error('No course selected')
      const email = enrollEmail.trim()
      if (!email) throw new Error('Email is required')
      return await enrollStudentByEmail(editingCourse.id, email)
    },
    onSuccess: async () => {
      setEnrollEmail('')
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
      await qc.refetchQueries({ queryKey: ['admin', 'courses'] })
      await refetch()
      alert('Student enrolled successfully')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to enroll student'
      alert(msg)
    }
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (course: any) => {
    setForm({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      period: course.period || '2025-1',
      group: course.group || 1,
    })
    setEditingCourse(course)
    setShowCreate(true)
  }

  const handleCloseModal = () => {
    setShowCreate(false)
    setEditingCourse(null)
    setForm({
      name: '',
      code: '',
      description: '',
      period: '2025-1',
      group: 1,
    })
  }

  return (
    <div className={styles.courseManagement}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Manage Courses</h1>
          <p className={styles.subtitle}>
            Create, edit, and manage courses
          </p>
        </div>
        <button 
          className={`btn btn-primary ${styles.createButton}`}
          onClick={() => setShowCreate(true)}
        >
          + Create Course
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          <option value="">All Periods</option>
          {uniquePeriods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
        {(searchQuery || periodFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('')
              setPeriodFilter('')
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3>No courses found</h3>
          <p>
            {searchQuery || periodFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first course.'}
          </p>
          {!searchQuery && !periodFilter && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
              style={{ marginTop: '16px' }}
            >
              Create Course
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th>Period</th>
                <th>Group</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredCourses.map((c: any) => (
                <tr key={c.id}>
                  <td className={styles.idCell}>{c.id || '-'}</td>
                  <td className={styles.nameCell}>{c.name || 'Untitled'}</td>
                  <td className={styles.codeCell}>{c.code || '-'}</td>
                  <td>{c.period || '-'}</td>
                  <td>{c.group || '-'}</td>
                  <td className={styles.actionsCell}>
                    <button
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter course name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Code *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="Enter course code (e.g., CS101)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Period *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder="Enter period (e.g., 2025-1)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Group *</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: Number(e.target.value) })}
                    min="1"
                    placeholder="Enter group number"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter course description..."
                    rows={4}
                  />
                </div>
              </div>

              {editingCourse && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Enroll Student (Email)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className={styles.input}
                        value={enrollEmail}
                        onChange={(e) => setEnrollEmail(e.target.value)}
                        placeholder="Enter student email"
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => enrollMutation.mutate()}
                        disabled={enrollMutation.isPending || !enrollEmail.trim()}
                      >
                        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll'}
                      </button>
                    </div>
                    <div className={styles.helpText}>
                      Enter the student's email to enroll them in this course.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (editingCourse) {
                    updateMutation.mutate(editingCourse.id)
                  } else {
                    createMutation.mutate()
                  }
                }}
                disabled={
                  (createMutation.isPending || updateMutation.isPending) || 
                  !form.name || 
                  !form.code ||
                  !form.period
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? (editingCourse ? 'Updating...' : 'Creating...')
                  : (editingCourse ? 'Update Course' : 'Create Course')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
