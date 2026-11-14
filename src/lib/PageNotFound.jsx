import { Link, useLocation } from 'react-router-dom';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const location = useLocation();
  const { user, isAuthenticated, authChecked } = useAuth();
  const pageName = location.pathname.replace(/^\/+/, '') || 'unknown';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E1A2B] p-6">
      <section className="w-full max-w-md text-center">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-[#AAB4C3]/30">404</h1>
          <div className="mx-auto h-0.5 w-16 bg-[#242D38]" />
        </div>
        <h2 className="mt-6 text-2xl font-medium text-white">Page Not Found</h2>
        <p className="mt-3 leading-relaxed text-[#AAB4C3]">
          The page <span className="font-medium text-white">"{pageName}"</span> could not be found.
        </p>

        {authChecked && isAuthenticated && hasOperationsAccess(user?.role) && (
          <aside className="mt-8 rounded-lg border border-[#242D38] bg-[#242D38] p-4 text-left">
            <p className="text-sm font-medium text-white">Operations note</p>
            <p className="mt-1 text-sm leading-relaxed text-[#AAB4C3]">
              This route is not registered in the current application.
            </p>
          </aside>
        )}

        <div className="pt-8">
          <Link
            to="/"
            className="inline-flex items-center rounded-lg border border-[#B08D57] bg-[#B08D57] px-4 py-2 text-sm font-medium text-[#0E1A2B] transition-colors hover:bg-[#B08D57]/90 focus:outline-none focus:ring-2 focus:ring-[#B08D57] focus:ring-offset-2 focus:ring-offset-[#0E1A2B]"
          >
            Return to Vantoris
          </Link>
        </div>
      </section>
    </main>
  );
}
