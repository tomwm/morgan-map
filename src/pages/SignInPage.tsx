import { SignIn } from '@clerk/clerk-react';
import { Map } from 'lucide-react';

export function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Map size={16} className="text-white" />
        </div>
        <span className="text-base font-bold text-gray-800 tracking-tight">Morgan Map</span>
      </div>
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/" signUpUrl="/sign-up" />
    </div>
  );
}
