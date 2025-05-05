import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, startTransition } from "react";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const HomePage = lazy(() => import("@/pages/home-page"));
const Marketplace = lazy(() => import("@/pages/marketplace"));
const BuyerDashboard = lazy(() => import("@/pages/buyer-dashboard"));
const SellerDashboard = lazy(() => import("@/pages/seller-dashboard"));
const UploadProject = lazy(() => import("@/pages/upload-project"));
const SellerProfile = lazy(() => import("@/pages/seller-profile"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/marketplace" component={Marketplace} />
        <ProtectedRoute path="/buyer-dashboard" component={BuyerDashboard} />
        <ProtectedRoute path="/seller-dashboard" component={SellerDashboard} />
        <ProtectedRoute path="/upload-project" component={UploadProject} />
        <ProtectedRoute path="/sellers/:id" component={SellerProfile} />
        <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
