import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getChallenges } from '../../services/challenges'
import { getCourses } from '../../services/courses'
import api from '../../services/api'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/ChallengeManagement.module.css'

export default function ChallengeManagement() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')

  const { data: challenges = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'challenges'],
    queryFn: () => getChallenges({ limit: 100 }),
    staleTime: 0, // Always consider data stale to ensure fresh data after updates
  })

  const { data: courses = [] } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => getCourses({ limit: 100 }),
  })

  const [form, setForm] = useState<any>({
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: '',
    timeLimit: 1000,
    memoryLimit: 256,
    courseId: '',
    status: 'DRAFT',
    testCases: [
      {
        input: '',
        expectedOutput: '',
        isHidden: false,
        order: 1,
      }
    ],
  })

  // Filter challenges
  const filteredChallenges = useMemo(() => {
    let filtered = challenges

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((c: any) =>
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((c: any) => {
        const status = String(c.status || '').toUpperCase()
        return status === statusFilter.toUpperCase()
      })
    }

    if (difficultyFilter) {
      filtered = filtered.filter((c: any) => {
        const difficulty = String(c.difficulty || '').toUpperCase()
        return difficulty === difficultyFilter.toUpperCase()
      })
    }

    return filtered
  }, [challenges, searchQuery, statusFilter, difficultyFilter])

  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!form.courseId || !form.courseId.trim()) {
        throw new Error('Course is required to create a challenge')
      }
      
      // Build payload according to backend schema (exact format as user specified)
      const payload = {
        title: form.title,
        description: form.description,
        difficulty: normalizeDifficulty(form.difficulty), // Ensure correct format
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        timeLimit: Number(form.timeLimit),
        memoryLimit: Number(form.memoryLimit),
        courseId: form.courseId.trim(),
        testCases: form.testCases
          .filter((tc: any) => tc.input.trim() && tc.expectedOutput.trim())
          .map((tc: any, index: number) => ({
            input: tc.input.trim(),
            expectedOutput: tc.expectedOutput.trim(),
            isHidden: tc.isHidden || false,
            order: index + 1,
          })),
      }
      
      console.log('Creating challenge with payload:', JSON.stringify(payload, null, 2))
      const res = await api.post('/challenges', payload)
      return res.data?.data
    },
    onSuccess: async () => {
      // Invalidate and refetch all challenge-related queries
      await qc.invalidateQueries({ queryKey: ['admin', 'challenges'] })
      await qc.invalidateQueries({ queryKey: ['challenges'] })
      
      // Refetch the challenges list
      await qc.refetchQueries({ queryKey: ['admin', 'challenges'] })
      
      setShowCreate(false)
      setForm({
        title: '',
        description: '',
        difficulty: 'Easy',
        tags: '',
        timeLimit: 1000,
        memoryLimit: 256,
        courseId: '',
        status: 'DRAFT',
        testCases: [
          {
            input: '',
            expectedOutput: '',
            isHidden: false,
            order: 1,
          }
        ],
      })
    },
    onError: (error: any) => {
      console.error('Failed to create challenge:', error)
      alert(error?.response?.data?.message || error?.message || 'Failed to create challenge')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/challenges/${id}`)
    },
    onSuccess: async (_, id) => {
      // Invalidate and refetch all challenge-related queries
      await qc.invalidateQueries({ queryKey: ['admin', 'challenges'] })
      await qc.invalidateQueries({ queryKey: ['challenges'] })
      await qc.invalidateQueries({ queryKey: ['challenge', id] })
      
      // Refetch the challenges list
      await qc.refetchQueries({ queryKey: ['admin', 'challenges'] })
    },
    onError: (error: any) => {
      console.error('Failed to delete challenge:', error)
      alert(error?.response?.data?.message || error?.message || 'Failed to delete challenge')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      // Build partial update payload - only include fields that are present and valid
      const payload: any = {}
      
      // Only include fields that have values or have changed
      if (form.title && form.title.trim()) {
        payload.title = form.title.trim()
      }
      if (form.description && form.description.trim()) {
        payload.description = form.description.trim()
      }
      if (form.difficulty) {
        payload.difficulty = normalizeDifficulty(form.difficulty) // Ensure correct format
      }
      if (form.tags && form.tags.trim()) {
        const tagsArray = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        if (tagsArray.length > 0) {
          payload.tags = tagsArray
        }
      }
      if (form.timeLimit && form.timeLimit > 0) {
        payload.timeLimit = Number(form.timeLimit)
      }
      if (form.memoryLimit && form.memoryLimit > 0) {
        payload.memoryLimit = Number(form.memoryLimit)
      }
      
      // Note: courseId is NOT in the update schema, so we don't send it
      
      // Convert status to lowercase as backend expects 'draft', 'published', 'archived'
      if (form.status) {
        payload.status = form.status.toLowerCase()
      }
      
      // Include test cases if they exist and are valid
      // Backend requires at least 1 test case if testCases is included
      const validTestCases = form.testCases
        .filter((tc: any) => tc.input && tc.input.trim() && tc.expectedOutput && tc.expectedOutput.trim())
        .map((tc: any, index: number) => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isHidden: tc.isHidden || false,
          order: index + 1,
        }))
      
      // Only include testCases if we have at least one valid test case
      if (validTestCases.length > 0) {
        payload.testCases = validTestCases
      }
      
      // Ensure we have at least one field to update
      if (Object.keys(payload).length === 0) {
        throw new Error('At least one field must be provided for update')
      }
      
      console.log('Updating challenge:', id, JSON.stringify(payload, null, 2))
      const res = await api.put(`/challenges/${id}`, payload)
      console.log('Update response:', res.data)
      return res.data?.data
    },
    onSuccess: async (data, id) => {
      console.log('Update successful, invalidating queries...')
      // Invalidate and refetch all challenge-related queries
      await qc.invalidateQueries({ queryKey: ['admin', 'challenges'] })
      await qc.invalidateQueries({ queryKey: ['challenges'] })
      await qc.invalidateQueries({ queryKey: ['challenge', id] })
      
      // Refetch the challenges list explicitly
      await qc.refetchQueries({ queryKey: ['admin', 'challenges'] })
      await refetch() // Also use the refetch from useQuery
      
      console.log('Queries invalidated and refetched')
      
      setEditingChallenge(null)
      setShowCreate(false)
      setForm({
        title: '',
        description: '',
        difficulty: 'Easy',
        tags: '',
        timeLimit: 1000,
        memoryLimit: 256,
        courseId: '',
        status: 'DRAFT',
        testCases: [
          {
            input: '',
            expectedOutput: '',
            isHidden: false,
            order: 1,
          }
        ],
      })
    },
    onError: (error: any) => {
      console.error('Failed to update challenge:', error)
      console.error('Error response:', error?.response?.data)
      
      // Show detailed error message
      let errorMessage = 'Failed to update challenge'
      if (error?.response?.data) {
        const errorData = error.response.data
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Show validation errors
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

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = String(status || '').toUpperCase()
    if (statusUpper === 'PUBLISHED') return styles.statusPublished
    if (statusUpper === 'ARCHIVED') return styles.statusArchived
    return styles.statusDraft
  }

  const getCourseName = (courseId: string) => {
    if (!courseId) return '-'
    const course = courses.find((c: any) => c.id === courseId)
    if (!course) return courseId
    return course.name || course.title || course.code || courseId
  }

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  // Normalize difficulty to backend format: "Easy", "Medium", "Hard"
  const normalizeDifficulty = (difficulty: string): string => {
    if (!difficulty) return 'Easy'
    const upper = difficulty.toUpperCase()
    if (upper === 'EASY') return 'Easy'
    if (upper === 'MEDIUM') return 'Medium'
    if (upper === 'HARD') return 'Hard'
    return difficulty // Return as-is if already in correct format
  }

  const handleEdit = (challenge: any) => {
    // Load test cases from challenge
    const testCases = challenge.testCases && challenge.testCases.length > 0
      ? challenge.testCases.map((tc: any, index: number) => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || tc.output || '',
          isHidden: tc.isHidden || false,
          order: index + 1,
        }))
      : [
          {
            input: '',
            expectedOutput: '',
            isHidden: false,
            order: 1,
          }
        ]
    
    setForm({
      title: challenge.title || '',
      description: challenge.description || '',
      difficulty: normalizeDifficulty(challenge.difficulty),
      tags: Array.isArray(challenge.tags) ? challenge.tags.join(', ') : '',
      timeLimit: challenge.timeLimit || 1000,
      memoryLimit: challenge.memoryLimit || 256,
      courseId: challenge.courseId || '',
      status: challenge.status || 'DRAFT',
      testCases: testCases,
    })
    setEditingChallenge(challenge)
    setShowCreate(true)
  }

  const handleCloseModal = () => {
    setShowCreate(false)
    setEditingChallenge(null)
    setForm({
      title: '',
      description: '',
      difficulty: 'Easy',
      tags: '',
      timeLimit: 1000,
      memoryLimit: 256,
      courseId: '',
      status: 'DRAFT',
      testCases: [
        {
          input: '',
          expectedOutput: '',
          isHidden: false,
          order: 1,
        }
      ],
    })
  }

  const addTestCase = () => {
    setForm({
      ...form,
      testCases: [
        ...form.testCases,
        {
          input: '',
          expectedOutput: '',
          isHidden: false,
          order: form.testCases.length + 1,
        }
      ]
    })
  }

  const removeTestCase = (index: number) => {
    if (form.testCases.length > 1) {
      setForm({
        ...form,
        testCases: form.testCases.filter((_: any, i: number) => i !== index)
      })
    }
  }

  const updateTestCase = (index: number, field: string, value: any) => {
    const updatedTestCases = [...form.testCases]
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value,
    }
    setForm({
      ...form,
      testCases: updatedTestCases,
    })
  }

  return (
    <div className={styles.challengeManagement}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Manage Challenges</h1>
          <p className={styles.subtitle}>
            Create, edit, and manage coding challenges
          </p>
        </div>
        <button 
          className={`btn btn-primary ${styles.createButton}`}
          onClick={() => setShowCreate(true)}
        >
          + Create Challenge
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search challenges..."
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
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          className={styles.filterSelect}
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        {(searchQuery || statusFilter || difficultyFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('')
              setDifficultyFilter('')
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
          <p>Loading challenges...</p>
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No challenges found</h3>
          <p>
            {searchQuery || statusFilter || difficultyFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first challenge.'}
          </p>
          {!searchQuery && !statusFilter && !difficultyFilter && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
              style={{ marginTop: '16px' }}
            >
              Create Challenge
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Course</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredChallenges.map((c: any) => (
                <tr key={c.id}>
                  <td className={styles.titleCell}>{c.title || 'Untitled'}</td>
                  <td>
                    <Badge difficulty={c.difficulty} variant="difficulty">
                      {c.difficulty || 'EASY'}
                    </Badge>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(c.status)}`}>
                      {String(c.status || 'DRAFT').toUpperCase()}
                    </span>
                  </td>
                  <td>{getCourseName(c.courseId)}</td>
                  <td className={styles.actionsCell}>
                    <Link
                      to={`/challenges/${c.id}`}
                      className={`${styles.actionButton} ${styles.viewButton}`}
                    >
                      View
                    </Link>
                    <button
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(c.id, c.title)}
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
                {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
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
                  <label className={styles.label}>Title *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter challenge title"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Difficulty *</label>
                  <select
                    className={styles.select}
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status *</label>
                  <select
                    className={styles.select}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Course</label>
                  <select
                    className={styles.select}
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  >
                    <option value="">No Course</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.title || c.code || c.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tags</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="arrays, hashmap, algorithms (comma separated)"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Time Limit (ms) *</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={form.timeLimit}
                    onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Memory Limit (MB) *</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={form.memoryLimit}
                    onChange={(e) => setForm({ ...form, memoryLimit: Number(e.target.value) })}
                    min="1"
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
                    placeholder="Describe the challenge problem..."
                    rows={6}
                  />
                </div>
              </div>

              {/* Test Cases Section */}
              <div className={styles.testCasesSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Test Cases</h3>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={addTestCase}
                  >
                    + Add Test Case
                  </button>
                </div>
                {form.testCases.map((testCase: any, index: number) => (
                  <div key={index} className={styles.testCaseCard}>
                    <div className={styles.testCaseHeader}>
                      <span className={styles.testCaseNumber}>Test Case {index + 1}</span>
                      {form.testCases.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeTestCaseButton}
                          onClick={() => removeTestCase(index)}
                          aria-label="Remove test case"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Input *</label>
                        <textarea
                          className={styles.textarea}
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          placeholder="Enter test case input..."
                          rows={3}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Expected Output *</label>
                        <textarea
                          className={styles.textarea}
                          value={testCase.expectedOutput}
                          onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                          placeholder="Enter expected output..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                        />
                        <span>Hidden (not visible to students)</span>
                      </label>
                    </div>
                  </div>
                ))}
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
                  if (editingChallenge) {
                    updateMutation.mutate(editingChallenge.id)
                  } else {
                    createMutation.mutate()
                  }
                }}
                disabled={
                  (createMutation.isPending || updateMutation.isPending) || 
                  !form.title || 
                  !form.description
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? (editingChallenge ? 'Updating...' : 'Creating...')
                  : (editingChallenge ? 'Update Challenge' : 'Create Challenge')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
