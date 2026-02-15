import { InviteAcceptPage } from '@/features/workspace';

interface InvitePageProps {
  params: Promise<{ inviteToken: string }>;
}

export default async function InvitePage({ params }: InvitePageProps): Promise<React.JSX.Element> {
  const { inviteToken } = await params;

  return <InviteAcceptPage inviteToken={inviteToken} />;
}
