import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourses, createCourse, updateCourse, deleteCourse, enrollStudentByEmail, getCourseById } from '../../services/courses'
import { getUsersByRole, getUserByEmail } from '../../services/users'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/CourseManagement.module.css'

export default function CourseManagement() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState<string>('')

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
    professorIds: [] as string[],
    studentEmails: [] as string[],
  })
  
  const [studentEmailInput, setStudentEmailInput] = useState('')

  // Fetch professors for the dropdown
  const { data: professors = [], isLoading: isLoadingProfessors } = useQuery({
    queryKey: ['professors'],
    queryFn: () => getUsersByRole('PROFESSOR'),
    enabled: showCreate || !!editingCourse || !!viewingCourse,
  })

  // Fetch students for viewing course details
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => getUsersByRole('STUDENT'),
    enabled: !!viewingCourse,
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
      
      const payload: any = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        period: form.period.trim(),
        group: Number(form.group),
      }
      
      // Add professorIds if professors are selected
      if (form.professorIds.length > 0) {
        payload.professorIds = form.professorIds
      }
      
      console.log('Creating course with payload:', JSON.stringify(payload, null, 2))
      const course = await createCourse(payload)
      
      // Enroll students by email after course creation
      if (course?.id && form.studentEmails.length > 0) {
        const enrollmentPromises = form.studentEmails.map(email => 
          enrollStudentByEmail(course.id, email).catch(err => {
            console.error(`Failed to enroll student ${email}:`, err)
            return null
          })
        )
        await Promise.all(enrollmentPromises)
      }
      
      return course
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
      
      // Add professorIds if professors are selected
      if (form.professorIds.length > 0) {
        payload.professorIds = form.professorIds
      }
      
      // Ensure we have at least one field to update
      if (Object.keys(payload).length === 0) {
        throw new Error('At least one field must be provided for update')
      }
      
      console.log('Updating course:', id, JSON.stringify(payload, null, 2))
      const course = await updateCourse(id, payload)
      
      // Enroll students by email after course update
      if (form.studentEmails.length > 0) {
        const enrollmentPromises = form.studentEmails.map(email => 
          enrollStudentByEmail(id, email).catch(err => {
            console.error(`Failed to enroll student ${email}:`, err)
            return null
          })
        )
        await Promise.all(enrollmentPromises)
      }
      
      return course
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
        professorIds: [],
        studentEmails: [],
      })
      setStudentEmailInput('')
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


  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleView = async (course: any) => {
    try {
      // Fetch full course details
      const courseDetails = await getCourseById(course.id)
      setViewingCourse(courseDetails)
    } catch (error) {
      console.error('Failed to fetch course details:', error)
      // Fallback to the course data we already have
      setViewingCourse(course)
    }
  }

  const handleEdit = (course: any) => {
    setForm({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      period: course.period || '2025-1',
      group: course.group || 1,
      professorIds: course.professorIds || [],
      studentEmails: [], // We'll load student emails separately if needed
    })
    setEditingCourse(course)
    setShowCreate(true)
  }

  const handleRemoveProfessor = (professorId: string) => {
    setForm({
      ...form,
      professorIds: form.professorIds.filter(id => id !== professorId)
    })
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
      professorIds: [],
      studentEmails: [],
    })
    setStudentEmailInput('')
  }

  const handleAddStudentEmail = async () => {
    const email = studentEmailInput.trim().toLowerCase()
    if (!email) return
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address')
      return
    }
    
    // Check if email already exists
    if (form.studentEmails.includes(email)) {
      alert('This email is already in the list')
      return
    }
    
    // Verify user exists (optional - we can skip this if you prefer)
    try {
      const user = await getUserByEmail(email)
      if (!user) {
        if (!window.confirm(`User with email ${email} not found. Do you want to add it anyway?`)) {
          return
        }
      }
    } catch (error) {
      console.warn('Could not verify user email:', error)
    }
    
    setForm({ ...form, studentEmails: [...form.studentEmails, email] })
    setStudentEmailInput('')
  }

  const handleRemoveStudentEmail = (email: string) => {
    setForm({
      ...form,
      studentEmails: form.studentEmails.filter(e => e !== email)
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
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      onClick={() => handleView(c)}
                    >
                      View
                    </button>
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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Professors</label>
                  {isLoadingProfessors ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--border)', 
                      borderRadius: '4px',
                      padding: '8px',
                      backgroundColor: 'var(--bg-primary)'
                    }}>
                      {professors.length === 0 ? (
                        <div style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                          No professors available
                        </div>
                      ) : (
                        professors.map((professor: any) => {
                          const professorName = professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim() || professor.email
                          const isSelected = form.professorIds.includes(professor.id)
                          return (
                            <label
                              key={professor.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({
                                      ...form,
                                      professorIds: [...form.professorIds, professor.id]
                                    })
                                  } else {
                                    setForm({
                                      ...form,
                                      professorIds: form.professorIds.filter(id => id !== professor.id)
                                    })
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '14px', flex: 1 }}>
                                {professorName}
                              </span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  )}
                  {form.professorIds.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {form.professorIds.length} professor{form.professorIds.length !== 1 ? 's' : ''} selected
                      </div>
                      {editingCourse && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {form.professorIds.map((professorId) => {
                            const professor = professors.find((p: any) => p.id === professorId)
                            const professorName = professor 
                              ? (professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim() || professor.email)
                              : professorId
                            return (
                              <div
                                key={professorId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                <span style={{ fontSize: '14px' }}>{professorName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProfessor(professorId)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '0 4px',
                                  }}
                                  aria-label="Remove professor"
                                >
                                  ×
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={styles.helpText}>
                    {editingCourse 
                      ? 'Select one or more professors to assign to this course. You can remove selected professors by clicking the × button.'
                      : 'Select one or more professors to assign to this course.'}
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Students (Email)</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="email"
                      className={styles.input}
                      value={studentEmailInput}
                      onChange={(e) => setStudentEmailInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddStudentEmail()
                        }
                      }}
                      placeholder="Enter student email and press Enter or click Add"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddStudentEmail}
                      disabled={!studentEmailInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {form.studentEmails.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {form.studentEmails.map((email, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudentEmail(email)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '18px',
                              padding: '0 4px',
                            }}
                            aria-label="Remove email"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.helpText}>
                    {editingCourse
                      ? 'Add student emails to enroll them in this course. You can remove students by clicking the × button. Students will be enrolled after course update.'
                      : 'Add student emails to enroll them in this course. Students will be enrolled after course creation/update.'}
                  </div>
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

      {/* View Course Details Modal */}
      {viewingCourse && (
        <div className={styles.modalOverlay} onClick={() => setViewingCourse(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Course Details</h2>
              <button
                className={styles.closeButton}
                onClick={() => setViewingCourse(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Basic Information */}
                <div>
                  <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>Basic Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <strong>Name:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{viewingCourse.name || '-'}</div>
                    </div>
                    <div>
                      <strong>Code:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{viewingCourse.code || '-'}</div>
                    </div>
                    <div>
                      <strong>Period:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{viewingCourse.period || '-'}</div>
                    </div>
                    <div>
                      <strong>Group:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{viewingCourse.group || '-'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Description:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{viewingCourse.description || '-'}</div>
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                        {viewingCourse.isActive !== false ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div>
                      <strong>Created:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                        {viewingCourse.createdAt ? new Date(viewingCourse.createdAt).toLocaleString() : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professors */}
                <div>
                  <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
                    Professors ({viewingCourse.professorIds?.length || 0})
                  </h3>
                  {viewingCourse.professorIds && viewingCourse.professorIds.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {viewingCourse.professorIds.map((professorId: string) => {
                        const professor = professors.find((p: any) => p.id === professorId)
                        const professorName = professor 
                          ? (professor.name || `${professor.firstName || ''} ${professor.lastName || ''}`.trim() || professor.email)
                          : professorId
                        return (
                          <div
                            key={professorId}
                            style={{
                              padding: '12px',
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ fontSize: '14px' }}>{professorName}</div>
                            {professor?.email && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {professor.email}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No professors assigned
                    </div>
                  )}
                </div>

                {/* Students */}
                <div>
                  <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
                    Students ({viewingCourse.studentIds?.length || 0})
                  </h3>
                  {viewingCourse.studentIds && viewingCourse.studentIds.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {viewingCourse.studentIds.map((studentId: string) => {
                        const student = students.find((s: any) => s.id === studentId)
                        const studentName = student 
                          ? (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email)
                          : studentId
                        return (
                          <div
                            key={studentId}
                            style={{
                              padding: '12px',
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ fontSize: '14px' }}>{studentName}</div>
                            {student?.email && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {student.email}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No students enrolled
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className="btn btn-secondary"
                onClick={() => setViewingCourse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
