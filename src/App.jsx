import React,{Suspense} from 'react';
import {Toaster} from '@/components/ui/toaster';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClientInstance} from '@/lib/query-client';
import {BrowserRouter as Router,Route,Routes,Navigate} from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import {AuthProvider,useAuth} from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from './components/vantoris/PageTransition';
import {ExceptionAuthProvider} from '@/components/vantoris/ExceptionAuthContext';
import MemberLayout from './components/vantoris/MemberLayout';
import OperationsRoute from './components/OperationsRoute';
import MemberRoute from './components/MemberRoute';

const Login=React.lazy(()=>import('./pages/Login'));
const StaffLogin=React.lazy(()=>import('./pages/StaffLogin'));
const Landing=React.lazy(()=>import('./pages/Landing'));
const Register=React.lazy(()=>import('./pages/Register'));
const ForgotPassword=React.lazy(()=>import('./pages/ForgotPassword'));
const ResetPassword=React.lazy(()=>import('./pages/ResetPassword'));
const BrandIdentity=React.lazy(()=>import('./pages/BrandIdentity'));

const Home=React.lazy(()=>import('./pages/Home'));
const MoveMoney=React.lazy(()=>import('./pages/MoveMoney'));
const Apply=React.lazy(()=>import('./pages/Apply'));
const ApplyKYC=React.lazy(()=>import('./pages/ApplyKYC'));
const Accounts=React.lazy(()=>import('./pages/Accounts'));
const AccountDetail=React.lazy(()=>import('./pages/AccountDetail'));
const Services=React.lazy(()=>import('./pages/Services'));
const Messages=React.lazy(()=>import('./pages/Messages'));
const Profile=React.lazy(()=>import('./pages/Profile'));
const MemberDocuments=React.lazy(()=>import('./pages/MemberDocuments'));
const More=React.lazy(()=>import('./pages/More'));
const Discovery=React.lazy(()=>import('./pages/Discovery'));
const Discover=React.lazy(()=>import('./pages/Discover'));
const DiscoverNews=React.lazy(()=>import('./pages/DiscoverNews'));
const DiscoverFX=React.lazy(()=>import('./pages/DiscoverFX'));
const DiscoverNGO=React.lazy(()=>import('./pages/DiscoverNGO'));
const DiscoverMarketing=React.lazy(()=>import('./pages/DiscoverMarketing'));
const MemberQR=React.lazy(()=>import('./pages/MemberQR'));
const Transactions=React.lazy(()=>import('./pages/Transactions'));
const Money=React.lazy(()=>import('./pages/product/Money'));
const CardsPage=React.lazy(()=>import('./pages/product/Cards'));
const TravelPage=React.lazy(()=>import('./pages/product/Travel'));
const HomesPage=React.lazy(()=>import('./pages/product/Homes'));
const NewsPage=React.lazy(()=>import('./pages/product/News'));
const AskPage=React.lazy(()=>import('./pages/product/Ask'));
const HeroBoxHub=React.lazy(()=>import('./pages/product/HeroBoxHub'));
const SupportPage=React.lazy(()=>import('./pages/product/Support'));
const DiscoverFlights=React.lazy(()=>import('./pages/DiscoverFlights'));
const DiscoverHousing=React.lazy(()=>import('./pages/DiscoverHousing'));
const TransactionDispute=React.lazy(()=>import('./pages/TransactionDispute'));
const HeroBox=React.lazy(()=>import('./pages/HeroBox'));
const Investment=React.lazy(()=>import('./pages/Investment'));

const LoadingFallback=()=>(
 <div className="fixed inset-0 flex items-center justify-center bg-background">
  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass"/>
 </div>
);

const AuthenticatedApp=()=>{
 const {isLoadingAuth,isLoadingPublicSettings,authError}=useAuth();
 if(isLoadingPublicSettings||isLoadingAuth)return <LoadingFallback/>;
 if(authError?.type==='user_not_registered')return <UserNotRegisteredError/>;
 return <Suspense fallback={<LoadingFallback/>}>
  <ExceptionAuthProvider>
   <Routes>
    <Route element={<PageTransition/>}>
     <Route path="/welcome" element={<Landing/>}/>
     <Route path="/login" element={<Login/>}/>
     <Route path="/staff/login" element={<StaffLogin/>}/>
     <Route path="/brand" element={<BrandIdentity/>}/>
     <Route path="/register" element={<Register/>}/>
     <Route path="/forgot-password" element={<ForgotPassword/>}/>
     <Route path="/reset-password" element={<ResetPassword/>}/>
    </Route>

    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace/>}/>}>
     <Route element={<MemberRoute/>}>
      <Route element={<MemberLayout/>}>
       <Route path="/" element={<Home/>}/>
       <Route path="/apply" element={<Apply/>}/>
       <Route path="/apply/kyc" element={<ApplyKYC/>}/>
       <Route path="/accounts" element={<Accounts/>}/>
       <Route path="/accounts/:id" element={<AccountDetail/>}/>
       <Route path="/services" element={<Services/>}/>
       <Route path="/messages" element={<Messages/>}/>
       <Route path="/profile" element={<Profile/>}/>
       <Route path="/documents" element={<MemberDocuments/>}/>
       <Route path="/advisor" element={<AskPage/>}/>
       <Route path="/discovery" element={<Discovery/>}/>
       <Route path="/discover" element={<Discover/>}/>
       <Route path="/discover/news" element={<DiscoverNews/>}/>
       <Route path="/discover/fx" element={<DiscoverFX/>}/>
       <Route path="/discover/ngo" element={<DiscoverNGO/>}/>
       <Route path="/discover/marketing" element={<DiscoverMarketing/>}/>
       <Route path="/discover/flights" element={<DiscoverFlights/>}/>
       <Route path="/discover/housing" element={<DiscoverHousing/>}/>
       <Route path="/transactions" element={<Transactions/>}/>
       <Route path="/qr" element={<MemberQR/>}/>
       <Route path="/money" element={<Money/>}/>
       <Route path="/cards" element={<CardsPage/>}/>
       <Route path="/travel" element={<TravelPage/>}/>
       <Route path="/homes" element={<HomesPage/>}/>
       <Route path="/news" element={<NewsPage/>}/>
       <Route path="/ask" element={<AskPage/>}/>
        <Route path="/assistant" element={<AskPage/>}/>
       <Route path="/herobox-hub" element={<HeroBoxHub/>}/>
       <Route path="/support" element={<SupportPage/>}/>
       <Route path="/move-money" element={<MoveMoney/>}/>
       <Route path="/move" element={<MoveMoney/>}/>
       <Route path="/more" element={<More/>}/>
       <Route path="/dispute" element={<TransactionDispute/>}/>
       <Route path="/herobox" element={<HeroBox/>}/>
       <Route path="/investment" element={<Investment/>}/>
      </Route>
     </Route>
    </Route>

    <Route path="/operations" element={<OperationsRoute/>}/>
     <Route path="/admin/*" element={<Navigate to="/operations" replace/>}/>
    <Route path="/staff/portal" element={<OperationsRoute/>}/>
    <Route path="/operations/*" element={<OperationsRoute/>}/>
    <Route path="*" element={<PageNotFound/>}/>
   </Routes>
  </ExceptionAuthProvider>
 </Suspense>;
};

export default function App(){
 return <AuthProvider>
  <QueryClientProvider client={queryClientInstance}>
   <Router><ScrollToTop/><AuthenticatedApp/><Toaster/></Router>
  </QueryClientProvider>
 </AuthProvider>;
}
