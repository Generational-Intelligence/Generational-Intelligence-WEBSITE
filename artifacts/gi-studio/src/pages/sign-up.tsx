import { SignUp } from '@clerk/react';
import logoLight from '@assets/2_1789327486256.png';
import logoDark from '@assets/1_1789327486254.png';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12">
        <div className="mb-12 flex justify-center">
          <img src={logoLight} alt="Generational Intelligence" className="h-10 w-auto dark:hidden opacity-80" />
          <img src={logoDark} alt="Generational Intelligence" className="hidden h-10 w-auto dark:block opacity-80" />
        </div>
        <SignUp 
          routing="path" 
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/workspace"
          appearance={{
            elements: {
              cardBox: "shadow-none border border-border bg-card rounded-lg",
              card: "bg-card rounded-lg",
              headerTitle: "font-serif text-2xl text-foreground",
              headerSubtitle: "text-muted-foreground text-sm font-sans",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium shadow-none rounded-md",
              formFieldInput: "bg-input border-transparent rounded-md text-foreground focus:ring-2 focus:ring-ring focus:border-transparent",
              formFieldLabel: "text-foreground text-sm font-medium",
              footerActionLink: "text-primary hover:text-primary/90 hover:underline",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/90",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground text-xs font-mono uppercase tracking-wider",
            }
          }}
        />
      </div>
    </div>
  );
}
