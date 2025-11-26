export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  period: string; // e.g., "2025-1"
  group: number;
  professorIds: string[];
  studentIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description: string;
  period: string;
  group: number;
  professorIds: string[];
}

export interface UpdateCourseRequest {
  name?: string;
  code?: string;
  description?: string;
  period?: string;
  group?: number;
  professorIds?: string[];
  isActive?: boolean;
}

export interface EnrollStudentRequest {
  studentId: string;
}

export interface CourseStudent {
  courseId: string;
  studentId: string;
  enrolledAt: Date;
}

