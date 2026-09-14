import { Link } from 'wouter';
import { ArrowRight, Lock } from 'lucide-react';
import logoLight from '@assets/2_1789327486256.png'; // black logo for light surfaces
import logoDark from '@assets/1_1789327486254.png'; // white logo for dark surfaces

export default function Intro() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-12 flex justify-center">
            <img src={logoLight} alt="Generational Intelligence" className="h-12 w-auto dark:hidden" />
            <img src={logoDark} alt="Generational Intelligence" className="hidden h-12 w-auto dark:block" />
          </div>

          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1 text-xs font-mono font-medium text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Studio Workspace</span>
            </div>
            
            <h1 className="text-3xl font-light text-foreground sm:text-4xl">
              Editorial Desk
            </h1>
            
            <p className="mx-auto max-w-sm text-base text-muted-foreground leading-relaxed">
              Private working space for curating, drafting, and reviewing intelligence content before publication.
            </p>

            <div className="pt-8">
              <Link href="/workspace" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover-elevate transition-all">
                Enter Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs font-mono text-muted-foreground/60">
          STRICTLY CONFIDENTIAL
        </p>
      </footer>
    </div>
  );
}
