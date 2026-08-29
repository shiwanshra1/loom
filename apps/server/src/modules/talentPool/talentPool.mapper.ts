import type { TalentSearchPageDto } from '@forge-loom/shared-types';
import { CollegeModel } from '../../models/College.js';
import type { TalentSearchResult } from './talentPool.service.js';

export async function toTalentSearchPageDto(
  result: TalentSearchResult
): Promise<TalentSearchPageDto> {
  const collegeIds = [
    ...new Set(result.profiles.map((p) => p.collegeId?.toString()).filter(Boolean)),
  ];
  const colleges = await CollegeModel.find({ _id: { $in: collegeIds } });
  const nameByCollegeId = new Map(colleges.map((c) => [c._id.toString(), c.name]));

  return {
    results: result.profiles.map((profile) => ({
      studentId: profile._id.toString(),
      name: profile.name,
      domain: profile.domain,
      skills: profile.skills,
      score: profile.builderScore,
      collegeName: profile.collegeId
        ? nameByCollegeId.get(profile.collegeId.toString())
        : undefined,
      course: profile.course,
      linkedIn: profile.linkedIn,
    })),
    nextCursor: result.nextCursor,
  };
}
