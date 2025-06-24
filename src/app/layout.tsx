import './globals.css';
import Navbar from '../components/Navbar';
import { Providers } from './providers';

export const metadata = {
  title: 'Budget Tracker',
  description: 'Track expenses, manage budgets, and achieve your savings goals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-4">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
