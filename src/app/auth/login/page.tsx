import { Container } from "@/components/layout/Container";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Container>
      <div className="py-8 max-w-md mx-auto">
        <h1 className="text-2xl font-serif font-semibold text-primary-900 text-center">
          Sign In
        </h1>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
