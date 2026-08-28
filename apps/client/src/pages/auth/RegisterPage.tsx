import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLLEGE_SCOPED_ROLES, Role, SELF_REGISTERABLE_ROLES } from '@forge-loom/shared-types';
import type { CollegeDto } from '@forge-loom/shared-types';
import { useAuth } from '../../auth/AuthContext';
import { ROLE_HOME_PATH, ROLE_LABELS } from '../../auth/roleHome';
import { apiRequest, ApiClientError } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// Every college-scoped role picks an existing college except CollegeAdmin,
// who founds a new one (their display name becomes its name) — see
// collegeProvisioning.ts on the server for the authoritative rule.
function needsCollegePicker(role: Role): boolean {
  return COLLEGE_SCOPED_ROLES.includes(role) && role !== Role.CollegeAdmin;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState<CollegeDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!needsCollegePicker(role) || colleges.length > 0) return;
    apiRequest<{ colleges: CollegeDto[] }>('/api/colleges')
      .then((data) => setColleges(data.colleges))
      .catch(() => undefined);
  }, [role, colleges.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const registeredUser = await register({
        email,
        password,
        displayName,
        role,
        collegeId: needsCollegePicker(role) ? collegeId : undefined,
      });
      navigate(ROLE_HOME_PATH[registeredUser.role], { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-blue-600">FORGE</span>
          <span className="ml-1 text-sm text-slate-400">LMS</span>
          <p className="mt-2 text-sm text-slate-500">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role">
              I am a...
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SELF_REGISTERABLE_ROLES.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="displayName">
              {role === Role.Student ? 'Full name' : 'Display name'}
            </label>
            <Input
              id="displayName"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={role === Role.Student ? 'Arjun Sharma' : 'Acme Corp'}
            />
          </div>

          {role === Role.CollegeAdmin && (
            <p className="-mt-2 text-xs text-slate-400">
              This creates a new college in Forge Loom, named after the display name above.
            </p>
          )}

          {needsCollegePicker(role) && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="college">
                College
              </label>
              <select
                id="college"
                required
                value={collegeId}
                onChange={(event) => setCollegeId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select your college…
                </option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || (needsCollegePicker(role) && !collegeId)}
            className="w-full"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
