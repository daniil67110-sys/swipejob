import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">SwipeJob</h1>
          <p className="mt-2 text-sm text-neutral-600">Trouve ton job en swipant.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
