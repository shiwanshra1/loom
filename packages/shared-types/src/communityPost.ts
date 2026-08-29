export interface CommunityPostDto {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export type CommunityMemberRole = 'lead' | 'volunteer' | 'public';

export interface CommunityMemberDto {
  userId: string;
  email: string;
  role: CommunityMemberRole;
}
