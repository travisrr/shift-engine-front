import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-shift-offwhite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shift-green border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
