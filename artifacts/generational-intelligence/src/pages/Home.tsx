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
import { ArrowRight, Menu, X, RotateCw } from 'lucide-react';
import { CompanyBrand, triskelionLogo } from '@/components/company-brand';

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your name (at least 2 characters).'),
  email: z.string().email('Please enter a valid email address.'),
  company: z.string().optional(),
  message: z.string().min(10, 'Please write a message of at least 10 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

const NAV = [
  { id: 'software', label: 'Our Software' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

const PRODUCT_WEBSITES: Record<string, { href: string; label: string }> = {
  gatherwell: { href: 'https://gatherwell.ie', label: 'Visit GatherWell website' },
  angaro: { href: 'https://angaro.ie', label: 'Visit Angaro website' },
};

const LEGAL = {
  cro: '797252',
};

const wrap = 'w-full max-w-[1160px] mx-auto px-5 md:px-7 lg:px-10';
const sectionPad = 'py-9 md:py-14';
const h2 = 'text-[30px] leading-[1.18] md:text-[38px] md:leading-[1.15] font-[650] tracking-[-0.015em] text-[#171C20]';
const bodyText = 'text-base leading-[1.55]';
const primaryBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-none bg-[#163F38] px-6 text-base font-semibold text-white hover:bg-[#102B27] transition-colors duration-150';

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F7F6F2] px-6">
        <div role="alert" className="max-w-md rounded-[14px] border border-[#DADDD7] bg-white p-8 text-left">
          <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-md bg-[#163F38]">
            <img src={triskelionLogo} alt="Generational Intelligence Triskelion emblem" width={1600} height={1600} className="h-full w-full object-contain" />
          </span>
          <h1 className="text-2xl font-[650] tracking-tight text-[#171C20]">This page could not be loaded</h1>
          <p className="mt-3 text-base text-[#6E746F] leading-relaxed">
            Please check your connection and try again in a moment.
          </p>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-retry"
            className={`${primaryBtn} mt-6`}
          >
            <RotateCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const projects = site.projects;

  return (
    <div className="min-h-[100dvh] bg-[#F7F6F2] text-[#171C20] flex flex-col font-sans overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-[#163F38] focus:text-white focus:px-4 focus:py-3 text-sm font-medium"
      >
        Skip to content
      </a>

      <SiteHeader companyName={site.companyName} />

      <main id="main" tabIndex={-1} className="flex-1 scroll-mt-[84px] focus:outline-none">
        {/* Hero */}
        <section className="bg-[#F7F6F2]">
          <div className={`${wrap} py-10 md:py-16`}>
            <div className="max-w-[900px]">
              <p className="text-sm font-medium leading-[1.3] text-[#163F38]">Independent software development · Ireland</p>
              <h1
                data-testid="text-tagline"
                className="mt-5 text-[34px] leading-[1.15] md:text-[52px] md:leading-[1.10] font-[650] tracking-[-0.02em] text-balance"
              >
                Software built around real-world needs.
              </h1>
              <p data-testid="text-description" className={`mt-6 max-w-[680px] ${bodyText} md:text-lg`}>
                Generational Intelligence develops practical digital platforms that help businesses simplify operations, connect services and work with greater clarity.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a href="#software" data-testid="link-hero-software" className={primaryBtn}>
                  Explore our software <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
                <a
                  href="#about"
                  data-testid="link-hero-about"
                  className="inline-flex h-11 items-center text-base font-semibold text-[#171C20] underline underline-offset-4 decoration-[#DADDD7] hover:decoration-[#163F38] transition-colors duration-150"
                >
                  About our company
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Software */}
        <section id="software" aria-labelledby="software-heading" className="bg-[#F0F2EE] border-y border-[#DADDD7]">
          <div className={`${wrap} ${sectionPad}`}>
            <SectionHead eyebrow="Our software" id="software-heading" title="Focused products. Practical purpose.">
              Two platforms currently in development.
            </SectionHead>
            <ul className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {projects.map((project) => (
                <li key={project.slug} className="flex">
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" aria-labelledby="contact-heading" className="bg-[#F0F2EE] border-t border-[#DADDD7]">
          <div className={`${wrap} ${sectionPad} grid grid-cols-1 lg:grid-cols-[40fr_60fr] items-start gap-8 lg:gap-14`}>
            <SectionHead id="contact-heading" title="Start a conversation.">
              For business enquiries, partnerships or interest in our developing platforms, send us a message.
            </SectionHead>
            <div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                  aria-busy={submitQuery.isPending}
                  className="rounded-[14px] border border-[#DADDD7] bg-white p-6 lg:p-8 space-y-6"
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
                          Company <span className="font-normal">(optional)</span>
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
                            className={`${fieldInput} min-h-[148px] py-3 resize-y`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className={fieldError} />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <p className="text-[15px] leading-[1.55] text-[#6E746F]">Your enquiry is sent privately to our team.</p>
                    <Button
                      type="submit"
                      disabled={submitQuery.isPending}
                      data-testid="button-submit"
                      className={`${primaryBtn} w-full sm:w-auto`}
                    >
                      {submitQuery.isPending ? 'Sending…' : 'Send enquiry'}
                      {!submitQuery.isPending && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#102B27] text-[#F7F6F2]">
        <div className={`${wrap} py-9 md:py-14 grid grid-cols-1 md:grid-cols-3 gap-10`}>
          <div>
            <CompanyBrand tone="dark" />
          </div>
          <nav aria-label="Our Software">
            <p className="text-sm font-semibold mb-3">Our Software</p>
            <ul>
              {projects.map((project) => {
                const website = PRODUCT_WEBSITES[project.slug];
                return website ? (
                  <li key={project.slug}>
                    <a href={website.href} target="_blank" rel="noopener noreferrer" data-testid={`link-footer-${project.slug}`} className={footerLink}>
                      {project.name}
                    </a>
                  </li>
                ) : null;
              })}
            </ul>
          </nav>
          <nav aria-label="Company">
            <p className="text-sm font-semibold mb-3">Company</p>
            <ul>
              {NAV.filter((n) => n.id !== 'software').map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} data-testid={`link-footer-${n.id}`} className={footerLink}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div id="about" aria-labelledby="footer-about-heading" className="scroll-mt-[84px] border-t border-[#F7F6F2]/20">
          <div className={`${wrap} py-6`}>
            <h2 id="footer-about-heading" className="text-sm font-semibold leading-[1.55]">About Generational Intelligence</h2>
            <p className="mt-2 max-w-[720px] text-sm leading-[1.6]">
              Generational Intelligence Limited is an Irish software development company building practical digital products for real-world needs.
            </p>
            <p data-testid="text-legal" className="mt-2 text-[13px] leading-[1.5]">CRO {LEGAL.cro}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const footerLink =
  'inline-flex min-h-11 items-center text-[15px] text-[#F7F6F2] underline-offset-4 hover:underline transition-colors duration-150';
const fieldLabel = 'text-sm font-semibold text-[#171C20]';
const fieldInput =
  'h-12 rounded-none border border-[#6E746F] bg-white px-4 text-base text-[#171C20] placeholder:text-[#6E746F] focus-visible:ring-2 focus-visible:ring-[#163F38] focus-visible:ring-offset-0 focus-visible:border-[#163F38] aria-[invalid=true]:border-[#171C20] aria-[invalid=true]:border-2';
const fieldError = 'text-sm font-medium text-[#171C20]';

function SiteHeader({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#DADDD7] bg-[#F7F6F2]">
      <div className={`${wrap} h-[71px] md:h-[83px] flex items-center justify-between gap-6`}>
        <a href="#main" aria-label={`${companyName} home`} className="flex items-center min-w-0 rounded-md" data-testid="link-home">
          <CompanyBrand />
        </a>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  data-testid={`link-nav-${n.id}`}
                  className="inline-flex h-11 items-center text-sm leading-[1.3] font-medium text-[#171C20] hover:text-[#163F38] hover:underline underline-offset-4 transition-colors duration-150"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DADDD7] text-[#171C20]"
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
        <nav id="mobile-nav" aria-label="Mobile" className="md:hidden border-t border-[#DADDD7] bg-[#F7F6F2]">
          <ul className={`${wrap} py-2`}>
            {NAV.map((n) => (
              <li key={n.id} className="border-b border-[#DADDD7] last:border-0">
                <a
                  href={`#${n.id}`}
                  onClick={() => setOpen(false)}
                  data-testid={`link-mobile-${n.id}`}
                  className="flex h-14 items-center justify-between text-base font-medium"
                >
                  {n.label} <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#163F38]" />
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
  eyebrow,
  id,
  title,
  children,
}: {
  eyebrow?: string;
  id: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="mb-3 text-sm font-medium leading-[1.3] text-[#163F38]">{eyebrow}</p>}
      <h2 id={id} className={h2}>
        {title}
      </h2>
      {children && <p className={`mt-4 ${bodyText} text-[#171C20]`}>{children}</p>}
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: { name: string; slug: string; category: string; status: string; description: string; logoPath?: string | null };
}) {
  const website = PRODUCT_WEBSITES[project.slug];
  return (
    <article
      data-testid={`card-project-${project.slug}`}
      className="flex w-full flex-col rounded-[14px] border border-[#DADDD7] bg-white p-5 md:p-6"
    >
      {project.logoPath && (
        <div className="flex h-[112px] md:h-[132px] w-full items-center justify-center bg-[#163F38] px-6">
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
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[21px] md:text-[24px] leading-[1.2] font-[650] tracking-[-0.015em]">{project.name}</h3>
        <span
          data-testid={`status-project-${project.slug}`}
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-[#DADDD7] px-2.5 py-1 text-sm font-medium text-[#171C20]"
        >
          {project.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-[#6E746F]">{project.category}</p>
      <p className="mt-4 text-base leading-[1.55]">{project.description}</p>
      {website && (
        <div className="mt-auto pt-5">
          <a
            href={website.href}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-project-${project.slug}`}
            className="inline-flex min-h-11 items-center gap-2 text-base font-semibold text-[#163F38] underline-offset-4 hover:underline transition-colors duration-150"
          >
            {website.label} <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      )}
    </article>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F6F2]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="border-b border-[#DADDD7] h-[72px] md:h-[84px]" />
      <div className={`${wrap} py-24 space-y-6`}>
        <div className="h-4 w-48 rounded bg-[#F0F2EE]" />
        <div className="h-14 w-3/4 rounded bg-[#F0F2EE]" />
        <div className="h-5 w-1/2 rounded bg-[#F0F2EE]" />
        <div className="grid md:grid-cols-2 gap-8 pt-12">
          <div className="h-64 rounded-[14px] bg-white border border-[#DADDD7]" />
          <div className="h-64 rounded-[14px] bg-white border border-[#DADDD7]" />
        </div>
      </div>
    </div>
  );
}
