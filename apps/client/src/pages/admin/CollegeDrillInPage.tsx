import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Layers, Users } from 'lucide-react';
import {
  useCollegeBatches,
  useCollegeFaculty,
  useCollegePrograms,
  useCollegeStudents,
} from '../../features/college/hooks';
import { useMyCourses } from '../../features/course-admin/hooks';
import { useAdminColleges } from '../../features/admin/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { PageLoading } from '../../components/ui/PageLoading';
import { DataTable } from '../../components/ui/DataTable';

// Read-only — Forge Admin can view any onboarded college's roster, batches,
// and courses from one place (Forge Admin hierarchy Phase 9), but every
// mutation (invite, bulk-upload, batch move, course create/edit) stays
// College Admin's own job. Reuses College Admin's exact data hooks,
// parameterized with this college's id instead of "mine".
export function CollegeDrillInPage() {
  const { id } = useParams<{ id: string }>();
  const collegeId = id ?? '';

  const { data: colleges, isLoading: collegesLoading } = useAdminColleges();
  const { data: programs, isLoading: programsLoading } = useCollegePrograms(collegeId);
  const { data: faculty, isLoading: facultyLoading } = useCollegeFaculty(collegeId);
  const { data: batches, isLoading: batchesLoading } = useCollegeBatches(collegeId);
  const { data: students, isLoading: studentsLoading } = useCollegeStudents(collegeId);
  const { data: courses, isLoading: coursesLoading } = useMyCourses(collegeId);

  const college = colleges?.find((c) => c.id === collegeId);

  if (
    collegesLoading ||
    programsLoading ||
    facultyLoading ||
    batchesLoading ||
    studentsLoading ||
    coursesLoading
  ) {
    return <PageLoading />;
  }

  return (
    <div>
      <Link
        to="/admin/colleges"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Colleges
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">
            {college?.name ?? 'College'}
          </h1>
          <p className="text-sm text-slate-500">
            {college?.adminEmail ?? 'No admin contact'} · {college?.location ?? 'No location'}
          </p>
        </div>
        {college && <Badge tone="blue">{college.partnerTier}</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Students" value={String(students?.length ?? 0)} />
        <StatCard
          icon={Layers}
          label="Batches"
          value={String(batches?.length ?? 0)}
          iconClassName="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Faculty"
          value={String(faculty?.length ?? 0)}
          iconClassName="bg-green-50 text-green-600"
        />
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={String(courses?.length ?? 0)}
          iconClassName="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Students</h2>
          <DataTable
            rows={students ?? []}
            rowKey={(s) => s.userId}
            emptyMessage="No students at this college yet."
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (s) => (
                  <div>
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </div>
                ),
              },
              { key: 'batch', header: 'Batch', render: (s) => s.cohortName ?? '—' },
            ]}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Faculty</h2>
          <DataTable
            rows={faculty ?? []}
            rowKey={(f) => f.userId}
            emptyMessage="No trainers or mentors at this college yet."
            columns={[
              { key: 'email', header: 'Email', render: (f) => f.email },
              {
                key: 'role',
                header: 'Role',
                render: (f) => (
                  <Badge tone={f.role === 'trainer' ? 'blue' : 'purple'}>{f.role}</Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Batches</h2>
          <DataTable
            rows={batches ?? []}
            rowKey={(b) => b.id}
            emptyMessage="No batches created yet."
            columns={[
              { key: 'name', header: 'Name', render: (b) => b.name },
              { key: 'phase', header: 'Phase', render: (b) => <Badge tone="slate">{b.phase}</Badge> },
            ]}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Courses</h2>
          <DataTable
            rows={courses ?? []}
            rowKey={(c) => c.id}
            emptyMessage="No courses created yet."
            columns={[
              { key: 'title', header: 'Title', render: (c) => c.title },
              {
                key: 'status',
                header: 'Status',
                render: (c) => (
                  <Badge tone={c.status === 'published' ? 'green' : 'slate'}>{c.status}</Badge>
                ),
              },
            ]}
          />
        </Card>

        {programs && programs.length > 0 && (
          <Card className="lg:col-span-2">
            <h2 className="mb-4 font-semibold text-slate-900">Enrollment by Program</h2>
            <DataTable
              rows={programs}
              rowKey={(p) => p.courseId}
              columns={[
                { key: 'title', header: 'Course', render: (p) => p.title },
                {
                  key: 'enrolled',
                  header: 'Students Enrolled',
                  render: (p) => String(p.studentsEnrolled),
                },
              ]}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
