import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClerkProvider } from '@clerk/react';
import NotFound from '@/pages/not-found';
import Intro from '@/pages/intro';
import SignInPage from '@/pages/sign-in';
import SignUpPage from '@/pages/sign-up';
import WorkspaceList from '@/pages/workspace/index';
import WorkspaceProject from '@/pages/workspace/project';
import WorkspaceSnapshots from '@/pages/workspace/snapshots';
import UnauthorizedPage from '@/pages/unauthorized';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { ProtectedRoute } from '@/components/auth/protected-route';

const queryClient = new QueryClient();
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Intro} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/unauthorized" component={UnauthorizedPage} />
        <Route path="/workspace">
          <ProtectedRoute>
            <WorkspaceList />
          </ProtectedRoute>
        </Route>
        <Route path="/workspace/snapshots">
          <ProtectedRoute>
            <WorkspaceSnapshots />
          </ProtectedRoute>
        </Route>
        <Route path="/workspace/projects/:id">
          <ProtectedRoute>
            <WorkspaceProject />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [location, setLocation] = useLocation();

  if (import.meta.env.PROD) {
    return <NotFound />;
  }

  if (!clerkPubKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <p className="text-destructive font-mono text-sm bg-destructive/10 px-4 py-2 rounded-md">Missing VITE_CLERK_PUBLISHABLE_KEY</p>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      routerPush={(to) => setLocation(to)}
      routerReplace={(to) => setLocation(to, { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
