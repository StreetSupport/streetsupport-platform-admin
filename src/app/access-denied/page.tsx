import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Access Denied | Street Support Admin',
  description: 'You do not have permission to view this page.',
};

export default function AccessDeniedPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto h-14 w-14 text-red-500 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. If you believe this is a mistake,
          please contact an administrator to request access.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-base btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
