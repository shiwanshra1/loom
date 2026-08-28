import { useQuery } from '@tanstack/react-query';

// Placements are still mock — no `placements` collection exists yet (that's
// Phase 10's schema-stub-only scope per milestone-1.md). Programs and
// faculty were real as of Phase 6; see features/college/hooks.ts.

export interface PlacementStat {
  domain: string;
  placements: number;
}

const MOCK_PLACEMENTS: PlacementStat[] = [
  { domain: 'Full Stack', placements: 28 },
  { domain: 'UI/UX', placements: 14 },
  { domain: 'Backend', placements: 19 },
  { domain: 'Data', placements: 9 },
];

export function useCollegePlacements() {
  return useQuery({
    queryKey: ['college', 'placements'],
    queryFn: () => Promise.resolve(MOCK_PLACEMENTS),
  });
}
