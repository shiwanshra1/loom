import { CourseEditorPage as SharedCourseEditorPage } from '../course-admin/CourseEditorPage';

// Reuses course-admin's exact create/edit form (Forge Admin hierarchy
// Phase 8) — the backend already scopes the resulting course to this
// College Admin's own college via the session, not anything this page sends.
export function CourseEditorPage() {
  return <SharedCourseEditorPage basePath="/college" />;
}
