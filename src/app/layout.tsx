import { Metadata } from 'next';
import './globals.css';

import Header from '@/components/partials/Header';
import Footer from '@/components/partials/Footer';
import NextAuthProvider from '@/components/auth/NextAuthProvider';
import ProtectedLayout from '@/components/auth/ProtectedLayout';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Nav from '@/components/partials/Nav';


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Street Support Admin',
    template: '%s | Street Support Admin'
  },
  description: 'Admin panel for managing the Street Support Network platform.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`h-full`}>
        <NextAuthProvider>
          <ProtectedLayout>
            <div className="flex flex-col min-h-screen">
              {/* <Header /> */}
              <Nav/>
              <Breadcrumbs />
              <main className="flex-grow pt-20">
                {children}
              </main>
              <Footer />
            </div>
          </ProtectedLayout>
        </NextAuthProvider>
      </body>
    </html>
  );
}
