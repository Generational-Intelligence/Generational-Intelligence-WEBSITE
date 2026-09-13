import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  Router as WouterRouter,
  useLocation,
} from 'wouter';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { StudioAuthProvider } from '@/components/auth/studio-auth-provider';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

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

function ClerkApp() {
  return (
    <StudioAuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </StudioAuthProvider>
  );
}

function App() {
  if (import.meta.env.PROD) {
    return <NotFound />;
  }

  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
