import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Role, SELF_REGISTERABLE_ROLES } from '@forge-loom/shared-types';
import { useAuth } from '../../auth/AuthContext';
import { ROLE_HOME_PATH, ROLE_LABELS } from '../../auth/roleHome';
import { ApiClientError } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>(Role.Student);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const registeredUser = await register({ email, password, displayName, role });
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

          <Button type="submit" disabled={submitting} className="w-full">
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
