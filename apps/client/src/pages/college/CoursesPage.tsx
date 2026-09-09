import { CourseListPage } from '../course-admin/CourseListPage';

// College Admin's course list reuses course-admin's exact list component
// (Forge Admin hierarchy Phase 8) — same /api/courses/mine endpoint, same
// UI, just pointed at /college's own route tree instead of /course-admin's.
export function CoursesPage() {
  return <CourseListPage basePath="/college" />;
}
