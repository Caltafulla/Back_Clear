import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyCourses } from '../services/courses'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'
import styles from '../styles/MyCourses.module.css'

export default function MyCoursesPage() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: getMyCourses,
    staleTime: 60000,
  })

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading courses...</p>
      </div>
    )
  }

  return (
    <div className={styles.myCourses}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Cursos</h1>
        <p className={styles.subtitle}>
          Aquí puedes ver todos los cursos en los que estás inscrito
        </p>
      </div>

      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3>No estás inscrito en ningún curso</h3>
          <p>Contacta a tu administrador para inscribirte en un curso.</p>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
          {courses.map((course: any) => (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.courseHeader}>
                <h3 className={styles.courseName}>{course.name || 'Sin nombre'}</h3>
                {course.code && (
                  <Badge variant="info">{course.code}</Badge>
                )}
              </div>
              <div className={styles.courseDetails}>
                <div className={styles.courseDetailItem}>
                  <span className={styles.courseDetailLabel}>ID:</span>
                  <span className={styles.courseDetailValue}>{course.id}</span>
                </div>
                {course.period && (
                  <div className={styles.courseDetailItem}>
                    <span className={styles.courseDetailLabel}>Período:</span>
                    <span className={styles.courseDetailValue}>{course.period}</span>
                  </div>
                )}
                {course.description && (
                  <div className={styles.courseDescription}>
                    <span className={styles.courseDetailLabel}>Descripción:</span>
                    <p className={styles.descriptionText}>{course.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

