import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center font-mono max-w-md mx-auto p-6 animate-in fade-in duration-500">
        <p className="text-xs mb-4 text-muted-foreground uppercase tracking-widest">[ 404 - SECTOR NOT FOUND ]</p>
        <h1 className="text-xl text-foreground mb-8 font-sans font-medium">
          The requested system node does not exist or has been relocated.
        </h1>
        <Link href="/" className="inline-flex items-center gap-3 text-xs uppercase tracking-widest text-primary hover:text-muted-foreground transition-colors border-b border-primary hover:border-muted-foreground pb-1">
          <ArrowLeft className="h-3 w-3" />
          <span>Return to Origin</span>
        </Link>
      </div>
    </div>
  );
}