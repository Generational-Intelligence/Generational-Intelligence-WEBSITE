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
import { Loader2, ArrowRight, CornerDownRight } from 'lucide-react';
import LogoWhite from '@assets/1_1789327486254.png';
import LogoMarkWhite from '@assets/1_1789327474600.png';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export default function Home() {
  const { data: site, isLoading, isError } = useGetPublicSite();
  const { toast } = useToast();
  
  const submitQuery = useSubmitQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitQuery.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: 'Query Received',
            description: 'Your message has been securely routed to our team.',
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Transmission Failed',
            description: 'There was an error routing your query. Please try again.',
          });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center font-mono text-sm animate-in fade-in duration-500">
          <p className="uppercase tracking-widest mb-2">[ SYSTEM OFFLINE ]</p>
          <p className="text-muted-foreground">Unable to establish connection to origin.</p>
        </div>
      </div>
    );
  }

  const deployedProjects = site.projects.filter(p => p.status.toLowerCase() === 'published' || p.status.toLowerCase() === 'deployed');
  const devProjects = site.projects.filter(p => p.status.toLowerCase() !== 'published' && p.status.toLowerCase() !== 'deployed');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background flex flex-col font-sans">
      <header className="px-6 py-12 md:px-16 flex justify-between items-start">
        <div className="flex items-center gap-4 md:gap-6">
          <img src={LogoWhite} alt={site.companyName} className="h-10 md:h-16 w-auto object-contain" />
          <span className="hidden md:block font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Generational Intelligence
          </span>
        </div>
        <div className="font-mono text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest text-right">
          <div>Studio</div>
          <div>[ Operational ]</div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-16">
        <section className="py-24 md:py-40 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="font-mono text-xs text-muted-foreground mb-8 uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-primary block"></span>
            Operational Knowledge to Digital Tools
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] mb-10">
            {site.tagline}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-light">
            {site.description}
          </p>
        </section>

        <div className="h-[1px] w-full bg-border my-8 md:my-16" />

        <section className="py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          <div className="lg:col-span-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground sticky top-12">
              [ Approved Software ]
            </h2>
          </div>
          
          <div className="lg:col-span-9 space-y-24">
            {deployedProjects.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
                <h3 className="font-mono text-sm mb-12 text-primary flex items-center gap-4">
                  <span>01</span>
                  <div className="h-[1px] flex-1 bg-border" />
                  <span className="uppercase tracking-widest">Deployed Systems</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                  {deployedProjects.map(project => (
                    <ProjectCard key={project.slug} project={project} />
                  ))}
                </div>
              </div>
            )}

            {devProjects.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                <h3 className="font-mono text-sm mb-12 text-muted-foreground flex items-center gap-4">
                  <span>02</span>
                  <div className="h-[1px] flex-1 bg-border" />
                  <span className="uppercase tracking-widest">In Development</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                  {devProjects.map(project => (
                    <ProjectCard key={project.slug} project={project} muted />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="h-[1px] w-full bg-border my-8 md:my-16" />

        <section className="py-16 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-16">
          <div className="lg:col-span-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground sticky top-12">
              [ Submit a Query ]
            </h2>
          </div>
          
          <div className="lg:col-span-6 lg:col-start-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Name</FormLabel>
                        <FormControl>
                          <Input className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors text-base" placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-wider" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                        <FormControl>
                          <Input className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors text-base" placeholder="address@domain.com" {...field} />
                        </FormControl>
                        <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-wider" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Company (Optional)</FormLabel>
                      <FormControl>
                        <Input className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors text-base" placeholder="Organization name" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-wider" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors text-base resize-none min-h-[160px] py-4" 
                          placeholder="Detail your operational requirements..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-wider" />
                    </FormItem>
                  )}
                />

                <div className="pt-8">
                  <Button 
                    type="submit" 
                    disabled={submitQuery.isPending}
                    className="w-full sm:w-auto rounded-none font-mono uppercase tracking-widest text-xs h-14 px-10 bg-primary text-primary-foreground hover:bg-primary/90 transition-all group flex items-center justify-center gap-4 border border-primary hover:border-primary"
                  >
                    {submitQuery.isPending ? 'Transmitting...' : 'Initiate Query'}
                    {submitQuery.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </section>
      </main>

      <footer className="px-6 py-12 md:px-16 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <img src={LogoMarkWhite} alt="Mark" className="h-5 w-5 opacity-60" />
          <span className="uppercase tracking-widest">&copy; {new Date().getFullYear()} Generational Intelligence</span>
        </div>
        <div className="uppercase tracking-widest">
          Discreet Software & Systems
        </div>
      </footer>
    </div>
  );
}

function ProjectCard({ project, muted = false }: { project: any, muted?: boolean }) {
  return (
    <div className={`group flex flex-col h-full ${muted ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <CornerDownRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {project.category}
          </span>
        </div>
        <h4 className="text-3xl font-medium tracking-tight group-hover:text-primary transition-colors">
          {project.name}
        </h4>
      </div>
      <div className="mt-auto">
        <p className="text-base text-muted-foreground leading-relaxed">
          {project.description}
        </p>
      </div>
    </div>
  );
}