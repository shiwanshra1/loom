import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Role } from '@forge-loom/shared-types';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { ROLE_HOME_PATH } from './auth/roleHome';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/student/HomePage';
import { CoursesPage } from './pages/student/CoursesPage';
import { CatalogPage } from './pages/student/CatalogPage';
import { CourseDetailPage } from './pages/student/CourseDetailPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { TrackerPage } from './pages/student/TrackerPage';
import { MentorSessionsPage } from './pages/student/MentorSessionsPage';
import { EventsPage } from './pages/student/EventsPage';
import { CitadelHubPage } from './pages/student/citadel/CitadelHubPage';
import { SprintCyclesPage } from './pages/student/citadel/SprintCyclesPage';
import { ProblemStatementPage } from './pages/student/citadel/ProblemStatementPage';
import { DashboardPage as MentorDashboardPage } from './pages/mentor/DashboardPage';
import { StudentsPage as MentorStudentsPage } from './pages/mentor/StudentsPage';
import { TeamsPage as MentorTeamsPage } from './pages/mentor/TeamsPage';
import { SessionsPage as MentorSessionsRolePage } from './pages/mentor/SessionsPage';
import { DashboardPage as TrainerDashboardPage } from './pages/trainer/DashboardPage';
import { CourseSessionsPage as TrainerCourseSessionsPage } from './pages/trainer/CourseSessionsPage';
import { DashboardPage as SpeakerDashboardPage } from './pages/speaker/DashboardPage';
import { DashboardPage as HrDashboardPage } from './pages/hr/DashboardPage';
import { TalentPoolPage } from './pages/hr/TalentPoolPage';
import { DashboardPage as SponsorDashboardPage } from './pages/sponsor/DashboardPage';
import { DashboardPage as CollegeDashboardPage } from './pages/college/DashboardPage';
import { DashboardPage as CommunityDashboardPage } from './pages/community/DashboardPage';
import { DashboardPage as MediaDashboardPage } from './pages/media/DashboardPage';
import { DashboardPage as MemberDashboardPage } from './pages/member/DashboardPage';
import { DashboardPage as AdminDashboardPage } from './pages/admin/DashboardPage';
import { CourseListPage } from './pages/course-admin/CourseListPage';
import { CourseEditorPage } from './pages/course-admin/CourseEditorPage';

function RootRedirect() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  if (status === 'authenticated' && user) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <Navigate to="/login" replace />;
}

// Plain function (not a JSX component) — React Router's <Routes> extracts its
// route config by walking the literal element tree looking for <Route>/
// <Fragment>, so this must return a <Route> directly rather than wrapping it
// in another component, which the traversal can't see through.
function roleSection(role: Role, children: ReactNode) {
  return (
    <Route
      key={role}
      path={ROLE_HOME_PATH[role]}
      element={
        <RequireRole role={role}>
          <Outlet />
        </RequireRole>
      }
    >
      {children}
    </Route>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              {roleSection(
                Role.Student,
                <>
                  <Route index element={<HomePage />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="courses/:id" element={<CourseDetailPage />} />
                  <Route path="catalog" element={<CatalogPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="tracker" element={<TrackerPage />} />
                  <Route path="citadel" element={<CitadelHubPage />} />
                  <Route path="citadel/sprints" element={<SprintCyclesPage />} />
                  <Route path="citadel/problem-statement" element={<ProblemStatementPage />} />
                  <Route path="mentor" element={<MentorSessionsPage />} />
                  <Route path="events" element={<EventsPage />} />
                </>
              )}

              {roleSection(
                Role.Mentor,
                <>
                  <Route index element={<MentorDashboardPage />} />
                  <Route path="students" element={<MentorStudentsPage />} />
                  <Route path="teams" element={<MentorTeamsPage />} />
                  <Route path="sessions" element={<MentorSessionsRolePage />} />
                </>
              )}

              {roleSection(
                Role.Trainer,
                <>
                  <Route index element={<TrainerDashboardPage />} />
                  <Route path="courses/:id" element={<TrainerCourseSessionsPage />} />
                </>
              )}
              {roleSection(Role.Speaker, <Route index element={<SpeakerDashboardPage />} />)}

              {roleSection(
                Role.Hr,
                <>
                  <Route index element={<HrDashboardPage />} />
                  <Route path="talent-pool" element={<TalentPoolPage />} />
                </>
              )}

              {roleSection(Role.Sponsor, <Route index element={<SponsorDashboardPage />} />)}
              {roleSection(Role.CollegeAdmin, <Route index element={<CollegeDashboardPage />} />)}
              {roleSection(
                Role.CommunityLeader,
                <Route index element={<CommunityDashboardPage />} />
              )}
              {roleSection(Role.MediaPartner, <Route index element={<MediaDashboardPage />} />)}
              {roleSection(Role.Member, <Route index element={<MemberDashboardPage />} />)}
              {roleSection(Role.ForgeAdmin, <Route index element={<AdminDashboardPage />} />)}

              {roleSection(
                Role.CourseAdmin,
                <>
                  <Route index element={<CourseListPage />} />
                  <Route path="courses/new" element={<CourseEditorPage />} />
                  <Route path="courses/:id/edit" element={<CourseEditorPage />} />
                </>
              )}
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
