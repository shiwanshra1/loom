import { useMemo, useState } from 'react';
import { Bookmark, Search, Send } from 'lucide-react';
import { useTalentPool } from '../../features/hr/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

const PAGE_SIZE = 3;

export function TalentPoolPage() {
  const { data: talent, isLoading } = useTalentPool();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  const [messaged, setMessaged] = useState<Record<string, boolean>>({});

  const domains = useMemo(() => ['all', ...new Set((talent ?? []).map((t) => t.domain))], [talent]);

  const filtered = useMemo(() => {
    if (!talent) return [];
    return talent.filter((profile) => {
      const matchesQuery =
        query.trim() === '' ||
        profile.name.toLowerCase().includes(query.toLowerCase()) ||
        profile.skills.some((skill) => skill.toLowerCase().includes(query.toLowerCase()));
      const matchesDomain = domain === 'all' || profile.domain === domain;
      const matchesScore = profile.score >= minScore;
      return matchesQuery && matchesDomain && matchesScore;
    });
  }, [talent, query, domain, minScore]);

  const visible = filtered.slice(0, visibleCount);
  const selected = talent?.find((t) => t.id === selectedId) ?? visible[0];

  if (isLoading || !talent) {
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
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
          <select
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Domains' : d}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Min Score
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value));
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-24"
            />
            <span className="w-8 text-slate-500">{minScore}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm text-slate-500">{filtered.length} results</p>
          <Card className="p-0">
            <div className="flex flex-col divide-y divide-slate-100 p-4">
              {visible.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No matches yet.</p>
              )}
              {visible.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedId(profile.id)}
                  className={`flex items-center justify-between gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                    (selected?.id ?? visible[0]?.id) === profile.id ? 'text-blue-700' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{profile.name}</p>
                    <p className="text-xs text-slate-500">{profile.domain}</p>
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
          {visibleCount < filtered.length && (
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load More
            </Button>
          )}
        </div>

        {selected && (
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
            <p className="text-sm text-slate-500">
              {selected.domain} · {selected.college}
            </p>
            <p className="mt-2 text-sm text-slate-600">{selected.bio}</p>

            <div className="my-4 flex flex-wrap gap-2">
              {selected.skills.map((skill) => (
                <Badge key={skill} tone="blue">
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Builder Score: <span className="font-semibold">{selected.score}</span>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">Projects</h3>
            <div className="mb-6 flex flex-col gap-2">
              {selected.projects.map((project) => (
                <div key={project.title} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">{project.title}</p>
                  <p className="text-xs text-slate-500">{project.description}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  setShortlisted((prev) => ({ ...prev, [selected.id]: !prev[selected.id] }))
                }
              >
                <Bookmark size={16} fill={shortlisted[selected.id] ? 'currentColor' : 'none'} />
                {shortlisted[selected.id] ? 'Shortlisted' : 'Shortlist'}
              </Button>
              <Button
                className="flex-1"
                disabled={messaged[selected.id]}
                onClick={() => setMessaged((prev) => ({ ...prev, [selected.id]: true }))}
              >
                <Send size={16} /> {messaged[selected.id] ? 'Sent' : 'Send Message'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
