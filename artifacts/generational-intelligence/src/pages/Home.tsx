import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, CarFront, MapPinned } from 'lucide-react';
import { useSubmitQuery } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CompanyBrand } from '@/components/company-brand';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  company: z.string().optional(),
  message: z.string().trim().min(10, 'Please write at least ten characters.'),
});
type Enquiry = z.infer<typeof schema>;
const companies = [
  {slug:'angaro',name:'Angaro',description:'Delivery and fleet operations, route planning and practical tools for delivery teams.',url:'https://angaro.ie',logo:'angaro-original.png',icon:null},
  {slug:'gatherwell',name:'GatherWell',description:'A workplace catering and services marketplace connecting businesses with providers.',url:'https://gatherwell.ie',logo:'gatherwell-original.png',icon:null},
  {slug:'carma',name:'CARMA',description:'Vehicle information, maintenance history and greater trust for owners, mechanics and buyers.',url:'https://carmavintel.eu',logo:null,icon:CarFront},
  {slug:'hidden-gems',name:'Hidden Gems',description:'A community noticeboard for local events, activities, places and neighbourhood discoveries.',url:null,logo:null,icon:MapPinned},
] as const;
const legal = [{url:'/company-information',name:'Company Information'},{url:'/privacy',name:'Privacy Policy'},{url:'/terms',name:'Website Terms'}];

function CompanyCard({company}:{company:(typeof companies)[number]}) {
  const Icon=company.icon;
  return <article className="gi-card" data-testid={'card-project-'+company.slug}>
    <div className="gi-card-brand">
      {company.logo ? <><span className="gi-logo-panel"><img src={import.meta.env.BASE_URL+'brand-assets/'+company.logo} alt="" loading="lazy" /></span><h3 className="sr-only">{company.name}</h3></> :
        <><span className="gi-fallback-icon" aria-hidden="true">{Icon && <Icon size={25} />}</span><h3>{company.name}</h3></>}
    </div>
    <p>{company.description}</p>
    <div className="gi-card-link">
      {company.url ? <a href={company.url} target="_blank" rel="noopener noreferrer" data-testid={'link-project-'+company.slug} aria-label={'Visit '+company.name+' website (opens in a new tab)'}>Visit website <ArrowUpRight size={17} aria-hidden="true"/></a> : <span>Website coming soon</span>}
    </div>
  </article>;
}

export default function Home(){
  const {toast}=useToast(), submit=useSubmitQuery();
  const form=useForm<Enquiry>({resolver:zodResolver(schema),defaultValues:{name:'',email:'',company:'',message:''}});
  const onSubmit=(values:Enquiry)=>{
    if(submit.isPending)return;
    submit.mutate({data:values},{
      onSuccess:()=>{toast({title:'Enquiry sent',description:'Thank you. We have received your message.'});form.reset();},
      onError:()=>toast({variant:'destructive',title:'Enquiry not sent',description:'Please try again. Your message remains in the form.'})
    });
  };
  return <div className="gi-page">
    <a className="gi-skip" href="#main">Skip to content</a>
    <header className="gi-header"><div className="gi-wrap gi-header-inner"><CompanyBrand /></div></header>
    <main id="main" tabIndex={-1}>
      <section className="gi-wrap gi-hero">
        <h1 data-testid="text-tagline">Learning from the past.<br/>Improving the future.</h1>
        <p data-testid="text-description">We build practical software shaped by experience, knowledge and progress.</p>
      </section>
      <section className="gi-wrap gi-section" aria-labelledby="companies-heading">
        <h2 id="companies-heading">Our companies</h2>
        <div className="gi-grid">{companies.map(c=><CompanyCard key={c.slug} company={c}/>)}</div>
      </section>
      <section className="gi-wrap gi-section gi-contact" aria-labelledby="contact-heading">
        <div><h2 id="contact-heading">Contact us</h2><p>Have a question or want to learn more? Send us a message and we'll get back to you.</p></div>
        <Form {...form}><form className="gi-form" noValidate aria-busy={submit.isPending} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="gi-form-row">
            <FormField control={form.control} name="name" render={({field})=><FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} autoComplete="name" placeholder="Your name" data-testid="input-name"/></FormControl><FormMessage/></FormItem>}/>
            <FormField control={form.control} name="email" render={({field})=><FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" autoComplete="email" placeholder="Your email" data-testid="input-email"/></FormControl><FormMessage/></FormItem>}/>
          </div>
          <FormField control={form.control} name="message" render={({field})=><FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="Your message" data-testid="input-message"/></FormControl><FormMessage/></FormItem>}/>
          <Button className="gi-gold-button" type="submit" disabled={submit.isPending} data-testid="button-submit">{submit.isPending?'Sending…':'Send enquiry'}</Button>
        </form></Form>
      </section>
    </main>
    <footer className="gi-footer"><div className="gi-wrap">
      <div className="gi-about"><h2>About Generational Intelligence</h2><p>An Irish software company building useful products shaped by real experience.</p></div>
      <div className="gi-footer-bottom"><nav aria-label="Legal information">{legal.map((l,i)=><span key={l.url}>{i>0&&<span aria-hidden="true" className="gi-dot">·</span>}<a href={l.url}>{l.name}</a></span>)}</nav><p>Generational Intelligence Limited · CRO 797252 · © {new Date().getFullYear()}</p></div>
    </div></footer>
  </div>;
}
