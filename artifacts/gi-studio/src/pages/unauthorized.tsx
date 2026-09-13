import { useClerk } from '@clerk/react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import logo from '@assets/2_1789327486256.png'; // black logo for light surfaces

export default function UnauthorizedPage() {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const handleSignOut = () => {
    signOut(() => {
      setLocation('/');
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <img src={logo} alt="Generational Intelligence" className="mb-12 h-10 w-auto opacity-80 dark:hidden" />
        
        <div className="mb-6 rounded-full bg-destructive/10 p-4 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Access Denied
        </h1>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          This workspace is strictly reserved for the owner of Generational Intelligence. 
          Your account does not have editorial permissions.
        </p>
        
        <Button variant="outline" onClick={handleSignOut} className="w-full font-mono text-xs uppercase tracking-wider">
          Sign out & Return
        </Button>
      </div>
    </div>
  );
}
