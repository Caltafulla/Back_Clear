import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from '../../services/evaluations'
import { getCourses } from '../../services/courses'
import { getChallenges } from '../../services/challenges'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Badge from '../../components/ui/Badge'
import styles from '../../styles/EvaluationManagement.module.css'

export default function EvaluationManagement() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [courseFilter, setCourseFilter] = useState<string>('')

  const { data: evaluations = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'evaluations'],
    queryFn: () => getEvaluations({ limit: 100 }),
    staleTime: 0,
  })

  const { data: courses = [] } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => getCourses({ limit: 100 }),
  })

  const { data: challenges = [] } = useQuery({
    queryKey: ['admin', 'challenges'],
    queryFn: () => getChallenges({ limit: 100 }),
  })

  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    courseId: '',
    challengeIds: [] as string[],
    startDate: '',
    endDate: '',
    durationMinutes: 60,
    maxAttempts: 3,
    status: 'draft',
  })

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    let filtered = evaluations

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((e: any) =>
        e.name?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((e: any) => {
        const status = String(e.status || '').toLowerCase()
        return status === statusFilter.toLowerCase()
      })
    }

    if (courseFilter) {
      filtered = filtered.filter((e: any) => e.courseId === courseFilter)
    }

    return filtered
  }, [evaluations, searchQuery, statusFilter, courseFilter])

  // Helper to format date for input[type="datetime-local"]
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    // Format: YYYY-MM-DDTHH:mm
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Helper to convert datetime-local to ISO string
  const convertToISO = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return ''
    return new Date(dateTimeLocal).toISOString()
  }

  const getStatusBadgeClass = (status: string) => {
    const statusLower = String(status || '').toLowerCase()
    if (statusLower === 'active') return styles.statusActive
    if (statusLower === 'scheduled') return styles.statusScheduled
    if (statusLower === 'finished') return styles.statusFinished
    if (statusLower === 'cancelled') return styles.statusCancelled
    return styles.statusDraft
  }

  const getCourseName = (courseId: string) => {
    if (!courseId) return '-'
    const course = courses.find((c: any) => c.id === courseId)
    if (!course) return courseId
    return course.name || course.title || course.code || courseId
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!form.name || !form.name.trim()) {
        throw new Error('Name is required')
      }
      if (!form.description || form.description.trim().length < 10) {
        throw new Error('Description is required and must be at least 10 characters')
      }
      if (!form.courseId || !form.courseId.trim()) {
        throw new Error('Course is required')
      }
      if (!form.challengeIds || form.challengeIds.length === 0) {
        throw new Error('At least one challenge must be selected')
      }
      if (!form.startDate) {
        throw new Error('Start date is required')
      }
      if (!form.endDate) {
        throw new Error('End date is required')
      }
      if (new Date(form.endDate) <= new Date(form.startDate)) {
        throw new Error('End date must be after start date')
      }
      if (!form.durationMinutes || form.durationMinutes < 15 || form.durationMinutes > 480) {
        throw new Error('Duration must be between 15 and 480 minutes')
      }
      if (!form.maxAttempts || form.maxAttempts < 1 || form.maxAttempts > 10) {
        throw new Error('Max attempts must be between 1 and 10')
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        courseId: form.courseId.trim(),
        challengeIds: form.challengeIds,
        startDate: convertToISO(form.startDate),
        endDate: convertToISO(form.endDate),
        durationMinutes: Number(form.durationMinutes),
        maxAttempts: Number(form.maxAttempts),
      }

      console.log('Creating evaluation with payload:', JSON.stringify(payload, null, 2))
      return await createEvaluation(payload)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'evaluations'] })
      await qc.invalidateQueries({ queryKey: ['evaluations'] })
      await qc.refetchQueries({ queryKey: ['admin', 'evaluations'] })
      await refetch()

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
        status: 'draft',
      })
    },
    onError: (error: any) => {
      console.error('Failed to create evaluation:', error)
      let errorMessage = 'Failed to create evaluation'
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
      const payload: any = {}

      if (form.name && form.name.trim()) payload.name = form.name.trim()
      if (form.description !== undefined && form.description.trim()) {
        if (form.description.trim().length < 10) {
          throw new Error('Description must be at least 10 characters if provided')
        }
        payload.description = form.description.trim()
      }
      if (form.challengeIds && form.challengeIds.length > 0) {
        payload.challengeIds = form.challengeIds
      }
      if (form.startDate) {
        payload.startDate = convertToISO(form.startDate)
      }
      if (form.endDate) {
        payload.endDate = convertToISO(form.endDate)
      }
      if (form.durationMinutes && form.durationMinutes >= 15 && form.durationMinutes <= 480) {
        payload.durationMinutes = Number(form.durationMinutes)
      }
      if (form.maxAttempts && form.maxAttempts >= 1 && form.maxAttempts <= 10) {
        payload.maxAttempts = Number(form.maxAttempts)
      }
      if (form.status) {
        payload.status = form.status.toLowerCase()
      }

      if (Object.keys(payload).length === 0) {
        throw new Error('At least one field must be provided for update')
      }

      // Validate endDate > startDate if both are provided
      if (payload.startDate && payload.endDate) {
        if (new Date(payload.endDate) <= new Date(payload.startDate)) {
          throw new Error('End date must be after start date')
        }
      }

      console.log('Updating evaluation:', id, JSON.stringify(payload, null, 2))
      return await updateEvaluation(id, payload)
    },
    onSuccess: async (_, id) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'evaluations'] })
      await qc.invalidateQueries({ queryKey: ['evaluations'] })
      await qc.refetchQueries({ queryKey: ['admin', 'evaluations'] })
      await refetch()

      setEditingEvaluation(null)
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
        status: 'draft',
      })
    },
    onError: (error: any) => {
      console.error('Failed to update evaluation:', error)
      let errorMessage = 'Failed to update evaluation'
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
      await deleteEvaluation(id)
    },
    onSuccess: async (_, id) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'evaluations'] })
      await qc.invalidateQueries({ queryKey: ['evaluations'] })
      await qc.refetchQueries({ queryKey: ['admin', 'evaluations'] })
      await refetch()
    },
    onError: (error: any) => {
      console.error('Failed to delete evaluation:', error)
      alert(error?.response?.data?.message || error?.message || 'Failed to delete evaluation')
    }
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (evaluation: any) => {
    setForm({
      name: evaluation.name || '',
      description: evaluation.description || '',
      courseId: evaluation.courseId || '',
      challengeIds: Array.isArray(evaluation.challengeIds) ? evaluation.challengeIds : [],
      startDate: formatDateForInput(evaluation.startDate),
      endDate: formatDateForInput(evaluation.endDate),
      durationMinutes: evaluation.durationMinutes || 60,
      maxAttempts: evaluation.maxAttempts || 3,
      status: evaluation.status || 'draft',
    })
    setEditingEvaluation(evaluation)
    setShowCreate(true)
  }

  const handleCloseModal = () => {
    setShowCreate(false)
    setEditingEvaluation(null)
    setForm({
      name: '',
      description: '',
      courseId: '',
      challengeIds: [],
      startDate: '',
      endDate: '',
      durationMinutes: 60,
      maxAttempts: 3,
      status: 'draft',
    })
  }

  const toggleChallenge = (challengeId: string) => {
    if (form.challengeIds.includes(challengeId)) {
      setForm({ ...form, challengeIds: form.challengeIds.filter((id: string) => id !== challengeId) })
    } else {
      setForm({ ...form, challengeIds: [...form.challengeIds, challengeId] })
    }
  }

  return (
    <div className={styles.evaluationManagement}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Manage Evaluations</h1>
          <p className={styles.subtitle}>
            Create, edit, and manage evaluations
          </p>
        </div>
        <button 
          className={`btn btn-primary ${styles.createButton}`}
          onClick={() => setShowCreate(true)}
        >
          + Create Evaluation
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search evaluations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="finished">Finished</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className={styles.filterSelect}
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name || c.title || c.code || c.id}
            </option>
          ))}
        </select>
        {(searchQuery || statusFilter || courseFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('')
              setCourseFilter('')
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
          <p>Loading evaluations...</p>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No evaluations found</h3>
          <p>
            {searchQuery || statusFilter || courseFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first evaluation.'}
          </p>
          {!searchQuery && !statusFilter && !courseFilter && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
              style={{ marginTop: '16px' }}
            >
              Create Evaluation
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
                <th>Course</th>
                <th>Challenges</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredEvaluations.map((e: any) => (
                <tr key={e.id}>
                  <td className={styles.idCell}>{e.id || '-'}</td>
                  <td className={styles.nameCell}>{e.name || 'Untitled'}</td>
                  <td>{getCourseName(e.courseId)}</td>
                  <td>{Array.isArray(e.challengeIds) ? e.challengeIds.length : 0}</td>
                  <td>{e.durationMinutes || 0}m</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(e.status)}`}>
                      {String(e.status || 'draft').toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={() => handleEdit(e)}
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(e.id, e.name)}
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
                {editingEvaluation ? 'Edit Evaluation' : 'Create New Evaluation'}
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
                    placeholder="Enter evaluation name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Course *</label>
                  <select
                    className={styles.select}
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    disabled={!!editingEvaluation}
                  >
                    <option value="">Select Course</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.title || c.code || c.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Duration (minutes) *</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    min="15"
                    max="480"
                    placeholder="60"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Attempts *</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={form.maxAttempts}
                    onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                    min="1"
                    max="10"
                    placeholder="3"
                  />
                </div>
                {editingEvaluation && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Status</label>
                    <select
                      className={styles.select}
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="finished">Finished</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={styles.dateGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Start Date *</label>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>End Date *</label>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description *</label>
                  <textarea
                    className={styles.textarea}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter evaluation description (minimum 10 characters)..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Challenges Selection */}
              <div className={styles.challengesSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Challenges *</h3>
                  <span className={styles.label}>
                    {form.challengeIds.length} selected
                  </span>
                </div>
                <div className={styles.challengesGrid}>
                  {challenges.map((c: any) => {
                    const checked = form.challengeIds.includes(c.id)
                    return (
                      <div
                        key={c.id}
                        className={styles.challengeCheckbox}
                        onClick={() => toggleChallenge(c.id)}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChallenge(c.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label onClick={(e) => e.stopPropagation()}>
                          {c.title || 'Untitled'}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
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
                  if (editingEvaluation) {
                    updateMutation.mutate(editingEvaluation.id)
                  } else {
                    createMutation.mutate()
                  }
                }}
                disabled={
                  (createMutation.isPending || updateMutation.isPending) || 
                  !form.name || 
                  !form.description ||
                  !form.courseId ||
                  form.challengeIds.length === 0 ||
                  !form.startDate ||
                  !form.endDate
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? (editingEvaluation ? 'Updating...' : 'Creating...')
                  : (editingEvaluation ? 'Update Evaluation' : 'Create Evaluation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
