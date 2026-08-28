import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CourseDto, CourseStatus } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';
import type { CreateCourseInput, UpdateCourseInput } from './types';

const MY_COURSES_KEY = ['course-admin', 'my-courses'];

export function useMyCourses() {
  return useQuery({
    queryKey: MY_COURSES_KEY,
    queryFn: () => apiRequest<{ courses: CourseDto[] }>('/api/courses/mine').then((r) => r.courses),
  });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-admin', 'course', courseId],
    queryFn: () =>
      apiRequest<{ course: CourseDto }>(`/api/courses/${courseId}`).then((r) => r.course),
    enabled: Boolean(courseId),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      apiRequest<{ course: CourseDto }>('/api/courses', { method: 'POST', body: input }).then(
        (r) => r.course
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY });
    },
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCourseInput) =>
      apiRequest<{ course: CourseDto }>(`/api/courses/${courseId}`, {
        method: 'PATCH',
        body: input,
      }).then((r) => r.course),
    onSuccess: (course) => {
      void queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY });
      queryClient.setQueryData(['course-admin', 'course', courseId], course);
    },
  });
}

export function useUpdateCourseStatus(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: CourseStatus) =>
      apiRequest<{ course: CourseDto }>(`/api/courses/${courseId}/status`, {
        method: 'PATCH',
        body: { status },
      }).then((r) => r.course),
    onSuccess: (course) => {
      void queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY });
      queryClient.setQueryData(['course-admin', 'course', courseId], course);
    },
  });
}
