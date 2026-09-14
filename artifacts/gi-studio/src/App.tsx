import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Intro from '@/pages/intro';
import WorkspaceList from '@/pages/workspace/index';
import WorkspaceProject from '@/pages/workspace/project';
import WorkspaceSnapshots from '@/pages/workspace/snapshots';
import {
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Intro} />
        <Route path="/workspace" component={WorkspaceList} />
        <Route path="/workspace/snapshots" component={WorkspaceSnapshots} />
        <Route path="/workspace/projects/:id" component={WorkspaceProject} />
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
  if (import.meta.env.PROD) {
    return <NotFound />;
  }

  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
