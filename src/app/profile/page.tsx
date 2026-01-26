import { Container } from "@/components/layout/Container";

export default function ProfilePage() {
  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-serif font-semibold text-primary-900">
          Your Profile
        </h1>
        <p className="mt-4 text-primary-600">
          Profile page - displays user information, karma, and post history.
        </p>
      </div>
    </Container>
  );
}
