import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useGetPublicSite, useSubmitQuery } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Menu, X, RotateCw } from 'lucide-react';
import { CompanyBrand, triskelionLogo } from '@/components/company-brand';

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your name (at least 2 characters).'),
  email: z.string().email('Please enter a valid email address.'),
  company: z.string().optional(),
  message: z.string().min(10, 'Please write a message of at least 10 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'software', label: 'Software' },
  { id: 'contact', label: 'Contact' },
];

const LEGAL = {
  cro: '797252',
};

const wrap = 'w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16';
const label = 'font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground';

export default function Home() {
  const { data: site, isLoading, isError, refetch, isFetching } = useGetPublicSite();
  const { toast } = useToast();
  const submitQuery = useSubmitQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', company: '', message: '' },
  });

  function onSubmit(values: FormValues) {
    if (submitQuery.isPending) return;
    submitQuery.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: 'Enquiry sent',
            description: 'Thank you. We have received your message and will reply by email.',
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Your enquiry was not sent',
            description: 'Something went wrong on our side. Your message is still in the form, so please try again.',
          });
        },
      },
    );
  }

  if (isLoading) return <LoadingState />;

  if (isError || !site) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6">
        <div role="alert" className="max-w-md border border-border bg-card p-8 text-left">
          <img src={triskelionLogo} alt="Generational Intelligence Triskelion emblem" width={1600} height={1600} className="h-14 w-14 mb-6 object-contain" />
          <p className={label}>Unavailable</p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight">This page could not be loaded</h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Please check your connection and try again in a moment.
          </p>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-retry"
            className="mt-6 h-12 rounded-none px-6 font-mono text-xs uppercase tracking-[0.14em] gap-3"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-foreground focus:text-background focus:px-4 focus:py-3 font-mono text-xs uppercase"
      >
        Skip to content
      </a>

      <SiteHeader companyName={site.companyName} />

      <main id="main" tabIndex={-1} className="flex-1 scroll-mt-[88px]">
        {/* Hero */}
        <section className="border-b border-border">
          <div className={`${wrap} pt-16 pb-16 md:pt-24 md:pb-24`}>
            <p className={`${label} flex items-center gap-3 mb-8`}>
              <span aria-hidden="true" className="h-2 w-2 bg-foreground" />
              Software development · Ireland
            </p>
            <h1
              data-testid="text-tagline"
              className="max-w-5xl text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[5.25rem] font-medium tracking-[-0.03em] text-balance"
            >
              {site.tagline}
            </h1>
            <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <p
                data-testid="text-description"
                className="lg:col-span-7 text-lg md:text-xl text-muted-foreground leading-relaxed"
              >
                {site.description}
              </p>
              <div className="lg:col-span-5 flex flex-wrap gap-3 lg:justify-end">
                <a
                  href="#software"
                  data-testid="link-hero-software"
                  className="inline-flex h-12 items-center gap-3 bg-foreground px-6 font-mono text-xs uppercase tracking-[0.14em] text-background hover:bg-foreground/90 transition-colors"
                >
                  View our software <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
                <a
                  href="#contact"
                  data-testid="link-hero-contact"
                  className="inline-flex h-12 items-center border border-border px-6 font-mono text-xs uppercase tracking-[0.14em] hover:border-foreground transition-colors"
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Software */}
        <section id="software" aria-labelledby="software-heading" className="border-b border-border">
          <div className={`${wrap} py-16 md:py-24`}>
            <SectionHead index="01" id="software-heading" title="Software in development">
              Two operational platforms, currently in development ahead of pilot use.
            </SectionHead>
            <ul className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {site.projects.map((project, i) => (
                <li key={project.slug} className="flex">
                  <ProjectCard project={project} index={i + 1} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* About */}
        <section id="about" aria-labelledby="about-heading" className="border-b border-border">
          <div className={`${wrap} py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16`}>
            <div className="lg:col-span-5">
              <SectionHead index="02" id="about-heading" title="About us" />
            </div>
            <div className="lg:col-span-7 space-y-8">
              <p className="text-lg md:text-xl leading-relaxed">
                {site.companyName} is a private limited company registered in Ireland. We design and
                build software for workplace services and delivery operations.
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-border">
                <Fact term="Legal entity" value={site.companyName} />
                <Fact term="Company number" value={`CRO ${LEGAL.cro}`} />
                <Fact term="Activity" value="Software development" />
                <Fact term="Registered in" value="Ireland" />
              </dl>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" aria-labelledby="contact-heading">
          <div className={`${wrap} py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16`}>
            <div className="lg:col-span-4">
              <SectionHead index="03" id="contact-heading" title="Contact us">
                For business enquiries, partnerships or pilot interest, send us a short note and we will reply by email.
              </SectionHead>
            </div>
            <div className="lg:col-span-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                  aria-busy={submitQuery.isPending}
                  className="border border-border bg-card p-6 md:p-10 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabel}>Name</FormLabel>
                          <FormControl>
                            <Input autoComplete="name" data-testid="input-name" className={fieldInput} {...field} />
                          </FormControl>
                          <FormMessage className={fieldError} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabel}>Email</FormLabel>
                          <FormControl>
                            <Input type="email" autoComplete="email" data-testid="input-email" className={fieldInput} {...field} />
                          </FormControl>
                          <FormMessage className={fieldError} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={fieldLabel}>
                          Company <span className="normal-case tracking-normal text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input autoComplete="organization" data-testid="input-company" className={fieldInput} {...field} />
                        </FormControl>
                        <FormMessage className={fieldError} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={fieldLabel}>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="input-message"
                            placeholder="Tell us briefly what you would like to discuss."
                            className={`${fieldInput} min-h-[160px] py-3 resize-y`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className={fieldError} />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <p className="text-sm text-muted-foreground">Your enquiry is sent privately to our team.</p>
                    <Button
                      type="submit"
                      disabled={submitQuery.isPending}
                      data-testid="button-submit"
                      className="h-12 w-full sm:w-auto rounded-none px-8 font-mono text-xs uppercase tracking-[0.14em] gap-3"
                    >
                      {submitQuery.isPending ? 'Sending…' : 'Send enquiry'}
                      {submitQuery.isPending ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className={`${wrap} py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10`}>
          <div className="md:col-span-5 space-y-4">
            <CompanyBrand />
            <p className="text-base text-muted-foreground max-w-sm">{site.tagline}</p>
          </div>
          <nav aria-label="Footer" className="md:col-span-2">
            <p className={`${label} mb-4`}>Sections</p>
            <ul>
              {NAV.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} data-testid={`link-footer-${n.id}`} className="inline-flex min-h-11 items-center text-base hover:underline underline-offset-4">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p className={`${label} mb-4`}>Company information</p>
            <p className="text-foreground">{site.companyName}</p>
            <p>Registered in Ireland · CRO {LEGAL.cro}</p>
            <p>Business activity: Software development</p>
          </div>
        </div>
        <div className="border-t border-border">
          <div className={`${wrap} py-6 flex flex-col sm:flex-row justify-between gap-2 font-mono text-xs text-muted-foreground`}>
            <p>&copy; {year} {site.companyName}</p>
            <a href="#main" className="hover:text-foreground">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const fieldLabel = 'font-mono text-xs uppercase tracking-[0.14em] text-foreground';
const fieldInput =
  'h-12 rounded-none border border-border bg-background px-4 text-base placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0 focus-visible:border-foreground aria-[invalid=true]:border-destructive';
const fieldError = 'text-sm font-medium text-destructive';

function SiteHeader({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className={`${wrap} h-[72px] flex items-center justify-between gap-6`}>
        <a href="#main" aria-label={`${companyName} home`} className="flex items-center min-w-0" data-testid="link-home">
          <CompanyBrand />
        </a>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  data-testid={`link-nav-${n.id}`}
                  className="inline-flex h-11 items-center px-4 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="md:hidden inline-flex h-11 w-11 items-center justify-center border border-border"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          data-testid="button-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="md:hidden border-t border-border bg-background">
          <ul className={`${wrap} py-2`}>
            {NAV.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <a
                  href={`#${n.id}`}
                  onClick={() => setOpen(false)}
                  data-testid={`link-mobile-${n.id}`}
                  className="flex h-14 items-center justify-between font-mono text-sm uppercase tracking-[0.14em]"
                >
                  {n.label} <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function SectionHead({
  index,
  id,
  title,
  children,
}: {
  index: string;
  id: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`${label} mb-4`}>{index} /</p>
      <h2 id={id} className="text-3xl md:text-4xl font-medium tracking-tight">
        {title}
      </h2>
      {children && <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">{children}</p>}
    </div>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="border-r border-b border-border p-5">
      <dt className={label}>{term}</dt>
      <dd className="mt-2 text-base">{value}</dd>
    </div>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: { name: string; slug: string; category: string; status: string; description: string; logoPath?: string | null };
  index: number;
}) {
  return (
    <article
      data-testid={`card-project-${project.slug}`}
      className="flex w-full flex-col border border-border bg-card p-6 md:p-10 hover:border-muted-foreground/60 transition-colors"
    >
      <div className="flex flex-col items-start gap-4 xl:flex-row xl:items-center xl:justify-between">
        <span className={label}>{String(index).padStart(2, '0')} · {project.category}</span>
        <span
          data-testid={`status-project-${project.slug}`}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-foreground/40 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em]"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-foreground" />
          {project.status}
        </span>
      </div>
      {project.logoPath && (
        <div className="mt-8 flex h-48 items-center justify-center border border-border bg-black px-6">
          <img
            src={`${import.meta.env.BASE_URL}${project.logoPath.replace(/^\//, '')}`}
            alt={`${project.name} official logo`}
            className="h-full w-full max-w-64 object-contain"
            loading="eager"
            decoding="async"
            data-testid={`logo-project-${project.slug}`}
          />
        </div>
      )}
      <h3 className="mt-8 text-4xl md:text-5xl font-medium tracking-[-0.02em]">{project.name}</h3>
      <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">{project.description}</p>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[100dvh] bg-background" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="border-b border-border h-[72px]" />
      <div className={`${wrap} py-24 space-y-6 animate-pulse`}>
        <div className="h-3 w-48 bg-muted" />
        <div className="h-14 w-3/4 bg-muted" />
        <div className="h-5 w-1/2 bg-muted" />
        <div className="grid md:grid-cols-2 gap-8 pt-12">
          <div className="h-64 bg-card border border-border" />
          <div className="h-64 bg-card border border-border" />
        </div>
      </div>
    </div>
  );
}
