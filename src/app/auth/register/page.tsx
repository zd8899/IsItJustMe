import { Container } from "@/components/layout/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <Container>
      <div className="py-8 max-w-md mx-auto">
        <h1 className="text-2xl font-serif font-semibold text-primary-900 text-center">
          Create Account
        </h1>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </Container>
  );
}
