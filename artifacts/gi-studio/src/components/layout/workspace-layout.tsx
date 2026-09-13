import { UserButton } from '@clerk/react';
import { Link, useLocation } from 'wouter';
import { Globe, FileText, Activity } from 'lucide-react';
import markWhite from '@assets/1_1789327474600.png';

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Narrow Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-16 flex-col items-center border-r border-border bg-sidebar py-6">
        <Link href="/workspace" className="mb-8 flex h-10 w-10 items-center justify-center rounded-full hover:bg-sidebar-accent transition-colors">
          <img src={markWhite} alt="Mark" className="h-6 w-6 invert dark:invert-0" />
        </Link>
        
        <nav className="flex flex-1 flex-col items-center gap-4">
          <NavItem href="/workspace" icon={<FileText className="h-5 w-5" />} active={location === '/workspace'} tooltip="Projects" />
          <NavItem href="/workspace/snapshots" icon={<Activity className="h-5 w-5" />} active={location === '/workspace/snapshots'} tooltip="Snapshots & History" />
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6">
          <a href="/" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Live Preview">
            <Globe className="h-5 w-5" />
          </a>
          <UserButton 
            appearance={{
              elements: { userButtonAvatarBox: "h-8 w-8 rounded-full border border-border" }
            }} 
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-16">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, active, tooltip }: { href: string; icon: React.ReactNode; active: boolean; tooltip: string }) {
  return (
    <Link 
      href={href} 
      className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
        active 
          ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }`}
      title={tooltip}
    >
      {icon}
    </Link>
  );
}
