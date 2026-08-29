import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, GraduationCap, XCircle } from 'lucide-react';
import type { AssessmentType, AttendanceStatus, CourseSessionDto } from '@forge-loom/shared-types';
import {
  useCourseAssessments,
  useCourseSessions,
  useCreateAssessment,
  useIssueCertificate,
  useMarkAttendance,
  useRoster,
  useUpdateSession,
} from '../../features/trainer/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';
import { Modal } from '../../components/ui/Modal';

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'exam', label: 'Exam' },
  { value: 'assignment', label: 'Assignment' },
];

const STATUS_BADGE: Record<
  CourseSessionDto['status'],
  { tone: 'blue' | 'green' | 'red'; label: string }
> = {
  scheduled: { tone: 'blue', label: 'Scheduled' },
  completed: { tone: 'green', label: 'Completed' },
  cancelled: { tone: 'red', label: 'Cancelled' },
};

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'excused', label: 'Excused' },
];

export function CourseSessionsPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { data: sessions, isLoading: sessionsLoading } = useCourseSessions(courseId);
  const { data: roster, isLoading: rosterLoading } = useRoster(courseId);
  const { data: assessments } = useCourseAssessments(courseId);
  const updateSession = useUpdateSession(courseId);
  const markAttendance = useMarkAttendance(courseId);
  const createAssessment = useCreateAssessment(courseId);
  const issueCertificate = useIssueCertificate(courseId);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [issuingFor, setIssuingFor] = useState<string | null>(null);

  const [attendanceSession, setAttendanceSession] = useState<CourseSessionDto | null>(null);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [cancelSession, setCancelSession] = useState<CourseSessionDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('quiz');
  const [assessmentDate, setAssessmentDate] = useState('');

  const sortedSessions = useMemo(
    () => [...(sessions ?? [])].sort((a, b) => a.dayNumber - b.dayNumber),
    [sessions]
  );

  if (sessionsLoading || rosterLoading) {
    return <PageLoading />;
  }

  function openAttendance(session: CourseSessionDto) {
    setAttendanceSession(session);
    setMarks({});
    setActionError(null);
  }

  async function submitAttendance() {
    if (!attendanceSession || !roster) return;
    setActionError(null);
    try {
      await markAttendance.mutateAsync({
        sessionId: attendanceSession.id,
        records: roster.map((entry) => ({
          studentId: entry.studentId,
          status: marks[entry.studentId] ?? 'present',
        })),
      });
      setAttendanceSession(null);
    } catch {
      setActionError('Could not submit attendance. Please try again.');
    }
  }

  function openCancel(session: CourseSessionDto) {
    setCancelSession(session);
    setCancelReason('');
    setActionError(null);
  }

  async function confirmCancel() {
    if (!cancelSession || !cancelReason.trim()) return;
    setActionError(null);
    try {
      await updateSession.mutateAsync({
        sessionId: cancelSession.id,
        status: 'cancelled',
        cancelReason: cancelReason.trim(),
      });
      setCancelSession(null);
    } catch {
      setActionError('Could not cancel this session. Please try again.');
    }
  }

  async function handleIssueCertificate(enrollmentId: string) {
    setCertificateError(null);
    setIssuingFor(enrollmentId);
    try {
      await issueCertificate.mutateAsync(enrollmentId);
    } catch {
      setCertificateError('Could not issue this certificate. Please try again.');
    } finally {
      setIssuingFor(null);
    }
  }

  async function handleAddAssessment() {
    if (!assessmentTitle.trim() || !assessmentDate) return;
    try {
      await createAssessment.mutateAsync({
        title: assessmentTitle.trim(),
        type: assessmentType,
        scheduledDate: new Date(assessmentDate).toISOString(),
      });
      setAssessmentTitle('');
      setAssessmentDate('');
    } catch {
      setActionError('Could not add the assessment. Please try again.');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Session Calendar</h1>
        <p className="text-sm text-slate-500">
          Take attendance day by day, or cancel a session with a reason.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <CalendarPlus size={16} /> Assessments
        </h2>
        <div className="mb-4 flex flex-col divide-y divide-slate-100">
          {assessments?.length === 0 && (
            <p className="py-2 text-sm text-slate-400">No assessments scheduled yet.</p>
          )}
          {assessments?.map((assessment) => (
            <div
              key={assessment.id}
              className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800">{assessment.title}</p>
                <Badge tone="amber">{assessment.type}</Badge>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(assessment.scheduledDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Title"
            className="flex-1"
            value={assessmentTitle}
            onChange={(e) => setAssessmentTitle(e.target.value)}
          />
          <select
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ASSESSMENT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
          />
          <Button
            onClick={handleAddAssessment}
            disabled={createAssessment.isPending || !assessmentTitle.trim() || !assessmentDate}
          >
            Add
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <GraduationCap size={16} /> Students
        </h2>
        {certificateError && <p className="mb-2 text-xs text-red-600">{certificateError}</p>}
        <div className="flex flex-col divide-y divide-slate-100">
          {roster?.length === 0 && (
            <p className="py-2 text-sm text-slate-400">No enrolled students yet.</p>
          )}
          {roster?.map((entry) => (
            <div
              key={entry.studentId}
              className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-slate-700">{entry.email}</span>
              {entry.enrollmentStatus === 'completed' ? (
                <Badge tone="green">Certificate Issued</Badge>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleIssueCertificate(entry.enrollmentId)}
                  disabled={issueCertificate.isPending && issuingFor === entry.enrollmentId}
                >
                  {issueCertificate.isPending && issuingFor === entry.enrollmentId
                    ? 'Issuing…'
                    : 'Issue Certificate'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {sortedSessions.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">
            No sessions yet — this course either has no enrolled students, or is delivered online
            (attendance doesn&apos;t apply to online courses).
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {sortedSessions.map((session) => {
          const badge = STATUS_BADGE[session.status];
          return (
            <Card key={session.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Day {session.dayNumber}</p>
                <p className="text-xs text-slate-500">
                  {new Date(session.scheduledDate).toLocaleDateString()}
                  {session.status === 'cancelled' && session.cancelReason
                    ? ` · Cancelled: ${session.cancelReason}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={badge.tone}>{badge.label}</Badge>
                {session.status === 'scheduled' && (
                  <>
                    <Button variant="secondary" onClick={() => openCancel(session)}>
                      Cancel
                    </Button>
                    <Button onClick={() => openAttendance(session)}>Take Attendance</Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={Boolean(attendanceSession)} onClose={() => setAttendanceSession(null)}>
        {attendanceSession && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              Attendance — Day {attendanceSession.dayNumber}
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Mark each student, then submit. Submitting also marks this session completed.
            </p>
            <div className="mb-4 flex max-h-72 flex-col gap-2 overflow-y-auto">
              {roster?.length === 0 && (
                <p className="text-sm text-slate-400">No enrolled students yet.</p>
              )}
              {roster?.map((entry) => (
                <div
                  key={entry.studentId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2"
                >
                  <span className="text-sm text-slate-700">{entry.email}</span>
                  <div className="flex gap-1">
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setMarks((prev) => ({ ...prev, [entry.studentId]: opt.value }))
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          (marks[entry.studentId] ?? 'present') === opt.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setAttendanceSession(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={submitAttendance}
                disabled={markAttendance.isPending || (roster?.length ?? 0) === 0}
              >
                {markAttendance.isPending ? 'Submitting…' : 'Submit Attendance'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={Boolean(cancelSession)} onClose={() => setCancelSession(null)}>
        {cancelSession && (
          <>
            <div className="mb-3 flex items-center gap-2 text-red-600">
              <XCircle size={20} />
              <h2 className="text-lg font-semibold text-slate-900">
                Cancel Day {cancelSession.dayNumber}
              </h2>
            </div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reason (required)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Trainer unavailable, venue conflict…"
            />
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setCancelSession(null)}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={confirmCancel}
                disabled={updateSession.isPending || !cancelReason.trim()}
              >
                {updateSession.isPending ? 'Cancelling…' : 'Confirm Cancel'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <CheckCircle2 size={14} /> Cancelled sessions are shown in red and are always
        distinguishable from an absence — a cancelled class never counts against a student.
      </div>
    </div>
  );
}
