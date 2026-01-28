import { Container } from "@/components/layout/Container";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { UserPostsList } from "@/components/profile/UserPostsList";

interface ProfilePageProps {
  params: { userId: string };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <Container>
      <div className="py-8 space-y-6">
        <ProfileHeader userId={params.userId} />
        <UserPostsList userId={params.userId} />
      </div>
    </Container>
  );
}
