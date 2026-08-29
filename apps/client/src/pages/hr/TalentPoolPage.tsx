import { useMemo, useState } from 'react';
import { Bookmark, Search, Send } from 'lucide-react';
import { useTalentPool } from '../../features/hr/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

export function TalentPoolPage() {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  const [messaged, setMessaged] = useState<Record<string, boolean>>({});

  const filters = useMemo(
    () => ({ query: query.trim() || undefined, domain: domain.trim() || undefined, minScore }),
    [query, domain, minScore]
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTalentPool(filters);

  const results = data?.pages.flatMap((page) => page.results) ?? [];
  const selected = results.find((r) => r.studentId === selectedId) ?? results[0];

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Talent Pool</h1>
      <p className="mb-6 text-sm text-slate-500">
        Search and filter Builder Profiles across all colleges.
      </p>

      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by name or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Input
            className="sm:w-40"
            placeholder="Domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Min Score
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24"
            />
            <span className="w-8 text-slate-500">{minScore}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm text-slate-500">{results.length} results</p>
          <Card className="p-0">
            <div className="flex flex-col divide-y divide-slate-100 p-4">
              {results.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No matches yet.</p>
              )}
              {results.map((profile) => (
                <button
                  key={profile.studentId}
                  type="button"
                  onClick={() => setSelectedId(profile.studentId)}
                  className={`flex items-center justify-between gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                    (selected?.studentId ?? results[0]?.studentId) === profile.studentId
                      ? 'text-blue-700'
                      : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{profile.name}</p>
                    <p className="text-xs text-slate-500">{profile.domain ?? 'No domain set'}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profile.skills.slice(0, 2).map((skill) => (
                        <Badge key={skill} tone="blue">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{profile.score}</span>
                </button>
              ))}
            </div>
          </Card>
          {hasNextPage && (
            <Button
              variant="secondary"
              className="mt-4 w-full"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </div>

        {selected && (
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
            <p className="text-sm text-slate-500">
              {selected.domain ?? 'No domain set'}
              {selected.collegeName ? ` · ${selected.collegeName}` : ''}
            </p>
            {selected.course && <p className="mt-2 text-sm text-slate-600">{selected.course}</p>}

            <div className="my-4 flex flex-wrap gap-2">
              {selected.skills.length === 0 && (
                <span className="text-xs text-slate-400">No skills listed yet.</span>
              )}
              {selected.skills.map((skill) => (
                <Badge key={skill} tone="blue">
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Builder Score: <span className="font-semibold">{selected.score}</span>
            </div>

            {selected.linkedIn && (
              <a
                href={selected.linkedIn}
                target="_blank"
                rel="noreferrer"
                className="mb-6 block text-sm text-blue-600 hover:underline"
              >
                View LinkedIn profile
              </a>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  setShortlisted((prev) => ({
                    ...prev,
                    [selected.studentId]: !prev[selected.studentId],
                  }))
                }
              >
                <Bookmark
                  size={16}
                  fill={shortlisted[selected.studentId] ? 'currentColor' : 'none'}
                />
                {shortlisted[selected.studentId] ? 'Shortlisted' : 'Shortlist'}
              </Button>
              <Button
                className="flex-1"
                disabled={messaged[selected.studentId]}
                onClick={() => setMessaged((prev) => ({ ...prev, [selected.studentId]: true }))}
              >
                <Send size={16} /> {messaged[selected.studentId] ? 'Sent' : 'Send Message'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
