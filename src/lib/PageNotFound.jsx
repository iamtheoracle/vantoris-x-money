import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { hasOperationsAccess } from '@/lib/operationsAccess';


export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0E1A2B]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-[#AAB4C3]/30">404</h1>
                        <div className="h-0.5 w-16 bg-[#242D38] mx-auto"></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-white">
                            Page Not Found
                        </h2>
                        <p className="text-[#AAB4C3] leading-relaxed">
                            The page <span className="font-medium text-white">"{pageName}"</span> could not be found.
                        </p>
                    </div>
                    
                    {/* Admin Note */}
                    {isFetched && authData.isAuthenticated && hasOperationsAccess(authData.user?.role) && (
                        <div className="mt-8 p-4 bg-[#242D38] rounded-lg border border-[#242D38]">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brass/20 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-[#B08D57]"></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-medium text-white">Operations Note</p>
                                    <p className="text-sm text-[#AAB4C3] leading-relaxed">
                                        This page hasn't been set up yet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="pt-6">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#0E1A2B] bg-[#B08D57] border border-[#B08D57] rounded-lg hover:bg-[#B08D57]/90 transition-colors duration-200 focus:outline-none"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}