import { useAuth } from '@clerk/react';
import { useGetStudioBootstrap, getGetStudioBootstrapQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  const { data: bootstrap, isLoading: isBootstrapLoading, error } = useGetStudioBootstrap({
    query: {
      queryKey: getGetStudioBootstrapQueryKey(),
      enabled: isLoaded && isSignedIn,
      retry: false
    }
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation('/sign-in');
    } else if (isLoaded && isSignedIn && bootstrap) {
      if (!bootstrap.isOwner) {
        setLocation('/unauthorized');
      }
    } else if (error) {
      // If error (e.g. 401 or 403 from backend), check if unauthorized
      setLocation('/unauthorized');
    }
  }, [isLoaded, isSignedIn, bootstrap, error, setLocation]);

  if (!isLoaded || (isSignedIn && isBootstrapLoading)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSignedIn && bootstrap?.isOwner) {
    return <>{children}</>;
  }

  return null;
}
