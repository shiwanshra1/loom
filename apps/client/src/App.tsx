import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Role } from '@forge-loom/shared-types';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { ROLE_HOME_PATH, ROLE_LABELS } from './auth/roleHome';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { HomePage } from './pages/student/HomePage';
import { CoursesPage } from './pages/student/CoursesPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { TrackerPage } from './pages/student/TrackerPage';
import { MentorSessionsPage } from './pages/student/MentorSessionsPage';
import { EventsPage } from './pages/student/EventsPage';
import { CitadelHubPage } from './pages/student/citadel/CitadelHubPage';
import { SprintCyclesPage } from './pages/student/citadel/SprintCyclesPage';
import { ProblemStatementPage } from './pages/student/citadel/ProblemStatementPage';

// Student has its own full route tree (Phase B); every other role still gets
// a single placeholder landing route until their phase lands.
const OTHER_ROLE_ROUTES = Object.values(Role)
  .filter((role) => role !== Role.Student)
  .map((role) => ({ role, path: ROLE_HOME_PATH[role] }));

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

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route
                path="/student"
                element={
                  <RequireRole role={Role.Student}>
                    <Outlet />
                  </RequireRole>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="tracker" element={<TrackerPage />} />
                <Route path="citadel" element={<CitadelHubPage />} />
                <Route path="citadel/sprints" element={<SprintCyclesPage />} />
                <Route path="citadel/problem-statement" element={<ProblemStatementPage />} />
                <Route path="mentor" element={<MentorSessionsPage />} />
                <Route path="events" element={<EventsPage />} />
              </Route>

              {OTHER_ROLE_ROUTES.map(({ role, path }) => (
                <Route
                  key={role}
                  path={path}
                  element={
                    <RequireRole role={role}>
                      <PlaceholderPage
                        title={`Welcome, ${ROLE_LABELS[role]}`}
                        note="Your dashboard is being built next — check back soon."
                      />
                    </RequireRole>
                  }
                />
              ))}
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
