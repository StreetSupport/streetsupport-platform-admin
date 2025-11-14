import { Metadata } from 'next';
import './globals.css';
import '@/styles/rich-text-editor.css';

import Footer from '@/components/partials/Footer';
import NextAuthProvider from '@/components/auth/NextAuthProvider';
import ProtectedLayout from '@/components/auth/ProtectedLayout';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Nav from '@/components/partials/Nav';
import { Toaster } from 'react-hot-toast';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';


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
          <BreadcrumbProvider>
            <ProtectedLayout>
            <div className="flex flex-col min-h-screen">
              {/* <Header /> */}
              <Nav/>
              <div className="flex-grow pt-20">
                <Breadcrumbs />
                <main>
                  {children}
                </main>
              </div>
              <Footer />
            </div>
            </ProtectedLayout>
          </BreadcrumbProvider>
          <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#48484a',
                  border: '1px solid #f3f3f3',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#0b9b75',
                    secondary: '#fff',
                  },
                  style: {
                    border: '1px solid #0b9b75',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#a90000',
                    secondary: '#fff',
                  },
                  style: {
                    border: '1px solid #a90000',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#38ae8e',
                    secondary: '#fff',
                  },
                  style: {
                    border: '1px solid #38ae8e',
                  },
                },
              }}
            />
        </NextAuthProvider>
      </body>
    </html>
  );
}
