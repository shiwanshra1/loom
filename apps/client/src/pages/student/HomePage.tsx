import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Zap,
  Calendar,
  ChevronRight,
  Linkedin,
  Mail,
  Star,
  Users,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  useFeaturedEvent,
  useStudentCourses,
  useStudentMentor,
  useStudentStats,
  useStudentUpcomingEvents,
} from '../../features/student/hooks';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PageLoading } from '../../components/ui/PageLoading';
import { Button } from '../../components/ui/Button';

export function HomePage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: courses, isLoading: coursesLoading } = useStudentCourses();
  const { data: events, isLoading: eventsLoading } = useStudentUpcomingEvents();
  const { data: mentor, isLoading: mentorLoading } = useStudentMentor();
  const { data: featured, isLoading: featuredLoading } = useFeaturedEvent();

  if (statsLoading || coursesLoading || eventsLoading || mentorLoading || featuredLoading) {
    return <PageLoading />;
  }

  const firstName = user?.email.split('@')[0] ?? 'there';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-slate-500">Keep learning, keep building.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Courses Enrolled"
            value={String(stats?.coursesEnrolled ?? 0)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Tasks Completed"
            value={String(stats?.tasksCompleted ?? 0)}
            iconClassName="bg-green-50 text-green-600"
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${stats?.currentStreak ?? 0} days`}
            iconClassName="bg-orange-50 text-orange-600"
          />
          <StatCard
            icon={Zap}
            label="XP Earned"
            value={String(stats?.xpEarned ?? 0)}
            iconClassName="bg-purple-50 text-purple-600"
          />
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">My Courses</h2>
            <Link
              to="/student/courses"
              className="flex items-center text-sm font-medium text-blue-600 hover:underline"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {courses?.slice(0, 4).map((course) => (
              <div key={course.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{course.name}</span>
                  <span className="text-slate-500">{course.progressPercent}%</span>
                </div>
                <ProgressBar
                  percent={course.progressPercent}
                  colorClassName={course.accentClassName}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Upcoming Events</h2>
            <Link
              to="/student/calendar"
              className="flex items-center text-sm font-medium text-blue-600 hover:underline"
            >
              View Calendar <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {events?.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Calendar size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {event.dateLabel} · {event.timeLabel} · {event.mode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
            <Star size={12} /> {featured?.tag}
          </span>
          <h2 className="mt-3 text-2xl font-bold">{featured?.title}</h2>
          <p className="text-sm font-medium text-blue-100">{featured?.tagline}</p>
          <p className="mt-3 text-sm text-blue-100">{featured?.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-blue-100">
            <div>
              <p className="font-semibold text-white">{featured?.dateLabel}</p>
              <p>Date</p>
            </div>
            <div>
              <p className="font-semibold text-white">{featured?.timeLabel}</p>
              <p>Time</p>
            </div>
            <div>
              <p className="font-semibold text-white">{featured?.venue}</p>
              <p>Venue</p>
            </div>
            <div>
              <p className="font-semibold text-white">{featured?.participants}</p>
              <p>Participants</p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="mt-4 w-full border-white/30 bg-white text-blue-700 hover:bg-blue-50"
          >
            Register Now
          </Button>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Mentor Assigned</h2>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {mentor?.initials}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{mentor?.name}</p>
              <p className="text-xs text-slate-500">{mentor?.title}</p>
              <p className="flex items-center gap-1 text-xs text-amber-600">
                <Star size={12} className="fill-amber-500 text-amber-500" /> {mentor?.rating} (
                {mentor?.reviewCount}+ mentees)
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href="#"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Linkedin size={16} /> LinkedIn
            </a>
            <a
              href="#"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Mail size={16} /> Message
            </a>
          </div>
          <Link to="/student/mentor">
            <Button className="mt-3 w-full">
              <Users size={16} /> Book a Session
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
