import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
export const AUTH_ENABLED = !!CLERK_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!AUTH_ENABLED || !CLERK_KEY) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      {children}
    </ClerkProvider>
  );
}
