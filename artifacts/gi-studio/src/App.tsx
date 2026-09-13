import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClerkProvider } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
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
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && (path === basePath || path.startsWith(`${basePath}/`))
    ? path.slice(basePath.length) || '/'
    : path;
}

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
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
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
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
