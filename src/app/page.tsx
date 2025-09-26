import { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Metadata for the admin dashboard
export const metadata: Metadata = {
  title: 'Admin Dashboard | Street Support',
  description: 'Administration dashboard for Street Support platform',
};

export default function DashboardPage() {
  redirect('/organisations');
}
