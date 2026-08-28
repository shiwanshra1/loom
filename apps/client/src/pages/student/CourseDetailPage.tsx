import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarX2,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import type { AttendanceHistoryEntryDto, VideoProgressDto } from '@forge-loom/shared-types';
import { useAuth } from '../../auth/AuthContext';
import {
  useCourseAssessments,
  useCourseAttendance,
  useCourseDetail,
  useCourseProgress,
  useUpdateVideoProgress,
  useVideoProgress,
} from '../../features/student/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressDonut } from '../../components/ui/ProgressDonut';
import { PageLoading } from '../../components/ui/PageLoading';
import { YouTubePlayer } from '../../components/video/YouTubePlayer';

const ATTENDANCE_BADGE: Record<
  'present' | 'absent' | 'excused',
  { tone: 'green' | 'red' | 'amber'; label: string }
> = {
  present: { tone: 'green', label: 'Present' },
  absent: { tone: 'red', label: 'Absent' },
  excused: { tone: 'amber', label: 'Excused' },
};

export function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourseDetail(courseId);
  const isOnline = course?.deliveryMode === 'online';

  const { data: attendance, isLoading: attendanceLoading } = useCourseAttendance(
    !isOnline ? user?.id : undefined,
    !isOnline ? courseId : undefined
  );
  const { data: videoProgress, isLoading: videoProgressLoading } = useVideoProgress(
    isOnline ? courseId : undefined
  );
  const { data: progress, isLoading: progressLoading } = useCourseProgress(user?.id, courseId);
  const { data: assessments } = useCourseAssessments(courseId);
  const updateProgress = useUpdateVideoProgress();

  const [activeDay, setActiveDay] = useState<number | null>(null);

  const attendanceByDay = useMemo(() => {
    const map = new Map<number, AttendanceHistoryEntryDto>();
    attendance?.forEach((entry) => map.set(entry.session.dayNumber, entry));
    return map;
  }, [attendance]);

  const progressByDay = useMemo(() => {
    const map = new Map<number, VideoProgressDto>();
    videoProgress?.forEach((entry) => map.set(entry.dayNumber, entry));
    return map;
  }, [videoProgress]);

  const calendarEntries = useMemo(() => {
    const sessionEntries = (!isOnline ? (attendance ?? []) : []).map((entry) => ({
      date: entry.session.scheduledDate,
      label: `Day ${entry.session.dayNumber}`,
      sub: entry.session.status === 'cancelled' ? 'Cancelled' : entry.session.status,
      tone: entry.session.status === 'cancelled' ? ('slate' as const) : ('blue' as const),
    }));
    const assessmentEntries = (assessments ?? []).map((assessment) => ({
      date: assessment.scheduledDate,
      label: assessment.title,
      sub: assessment.type,
      tone: 'amber' as const,
    }));
    return [...sessionEntries, ...assessmentEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [attendance, assessments, isOnline]);

  if (
    courseLoading ||
    (!isOnline && attendanceLoading) ||
    (isOnline && videoProgressLoading) ||
    progressLoading ||
    !course
  ) {
    return <PageLoading />;
  }

  const openDay = activeDay ?? course.syllabus[0]?.dayNumber ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{course.title}</h1>
          <Badge tone={isOnline ? 'blue' : 'purple'}>{isOnline ? 'Online' : 'Offline'}</Badge>
        </div>
        <p className="text-sm text-slate-500">{course.description || 'No description.'}</p>
      </div>

      {progress && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressDonut percent={progress.overallPercent} />
            <div className="grid flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Modules Complete</p>
                <p className="font-medium text-slate-900">
                  {progress.modulesCompleted} / {progress.modulesTotal}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Next Session</p>
                <p className="font-medium text-slate-900">
                  {progress.nextSession
                    ? `Day ${progress.nextSession.dayNumber} · ${new Date(progress.nextSession.scheduledDate).toLocaleDateString()}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Next Assessment</p>
                <p className="font-medium text-slate-900">
                  {progress.nextAssessment
                    ? `${progress.nextAssessment.title} · ${new Date(progress.nextAssessment.scheduledDate).toLocaleDateString()}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {calendarEntries.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
            <ClipboardList size={16} /> Course Calendar
          </h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {calendarEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{entry.label}</p>
                  <Badge tone={entry.tone}>{entry.sub}</Badge>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {course.syllabus.map((day) => {
          const isOpen = openDay === day.dayNumber;
          const attendanceEntry = attendanceByDay.get(day.dayNumber);
          const progressEntry = progressByDay.get(day.dayNumber);

          return (
            <Card key={day.dayNumber} className="p-0">
              <button
                type="button"
                onClick={() => setActiveDay(isOpen ? null : day.dayNumber)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Day {day.dayNumber}: {day.title}
                  </p>
                  {day.description && <p className="text-xs text-slate-500">{day.description}</p>}
                </div>

                {isOnline ? (
                  progressEntry?.completed ? (
                    <Badge tone="green">Watched</Badge>
                  ) : progressEntry ? (
                    <span className="text-xs font-medium text-slate-500">
                      {progressEntry.percentWatched}%
                    </span>
                  ) : (
                    <PlayCircle size={18} className="shrink-0 text-slate-300" />
                  )
                ) : attendanceEntry?.session.status === 'cancelled' ? (
                  <Badge tone="slate">
                    <span className="flex items-center gap-1">
                      <CalendarX2 size={12} /> Cancelled
                    </span>
                  </Badge>
                ) : attendanceEntry?.status ? (
                  <Badge tone={ATTENDANCE_BADGE[attendanceEntry.status].tone}>
                    {ATTENDANCE_BADGE[attendanceEntry.status].label}
                  </Badge>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <CircleDashed size={14} /> Not held yet
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 p-4">
                  {isOnline ? (
                    day.youtubeVideoId ? (
                      <div className="flex flex-col gap-2">
                        <YouTubePlayer
                          videoId={day.youtubeVideoId}
                          initialPositionSeconds={progressEntry?.lastPositionSeconds ?? 0}
                          onProgress={(positionSeconds, durationSeconds) => {
                            void updateProgress.mutateAsync({
                              courseId: course.id,
                              dayNumber: day.dayNumber,
                              positionSeconds,
                              durationSeconds,
                            });
                          }}
                        />
                        <ProgressBar percent={progressEntry?.percentWatched ?? 0} />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No video uploaded for this day yet.</p>
                    )
                  ) : attendanceEntry?.session.status === 'cancelled' ? (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <XCircle size={16} className="text-slate-400" /> This session was cancelled:{' '}
                      {attendanceEntry.session.cancelReason}
                    </p>
                  ) : attendanceEntry?.status ? (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-green-500" /> Marked{' '}
                      {ATTENDANCE_BADGE[attendanceEntry.status].label.toLowerCase()} on{' '}
                      {new Date(attendanceEntry.markedAt ?? '').toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Scheduled for{' '}
                      {attendanceEntry
                        ? new Date(attendanceEntry.session.scheduledDate).toLocaleDateString()
                        : 'a date to be announced'}{' '}
                      — attendance hasn&apos;t been taken yet.
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
