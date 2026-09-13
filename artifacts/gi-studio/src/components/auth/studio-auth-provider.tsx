import { ClerkProvider } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { useLocation } from 'wouter';

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

/**
 * Development Studio auth boundary.
 *
 * Keep Clerk isolated here so it can later be replaced by the Replit private
 * preview boundary only after that platform control is explicitly confirmed.
 * The current default remains fail-closed: no Clerk key means no Studio UI.
 */
export function StudioAuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <p className="text-destructive font-mono text-sm bg-destructive/10 px-4 py-2 rounded-md">
          Missing VITE_CLERK_PUBLISHABLE_KEY
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}