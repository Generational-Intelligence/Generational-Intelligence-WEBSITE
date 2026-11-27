import { CompanyBrand } from '@/components/company-brand';
export default function LegalPage({kind}:{kind:'company'|'privacy'|'terms'}){
  const pages={
    company:{title:'Company Information',items:['Generational Intelligence Limited','CRO 797252','Registered in Ireland.','Registered-office details are pending a business-address update. This draft requires legal review before publication.']},
    privacy:{title:'Privacy Policy',items:['This is a pre-publication draft. The privacy notice must be checked against the actual hosting, email, retention and processing practices before publication.','The contact form collects your name, email address and message to allow us to respond to enquiries.','Please avoid submitting sensitive personal information through the contact form.']},
    terms:{title:'Website Terms',items:['This website provides general information about Generational Intelligence Limited and its software companies.','Individual software services operate their own websites and may apply separate product terms.','This page is a draft awaiting legal review before publication.']}
  } as const;
  const page=pages[kind];
  return <div className="gi-page"><header className="gi-header"><div className="gi-wrap gi-header-inner"><a href="/" aria-label="Return to homepage"><CompanyBrand/></a></div></header>
    <main className="gi-wrap" style={{maxWidth:800,minHeight:'60vh',paddingBlock:40}}><a href="/" style={{textDecoration:'underline'}}>← Back to homepage</a><h1 style={{fontSize:34,fontWeight:800,marginTop:20}}>{page.title}</h1>{page.items.map((t,i)=><p key={i} style={{marginTop:16}}>{t}</p>)}</main>
    <footer className="gi-footer"><div className="gi-wrap gi-footer-bottom">Generational Intelligence Limited · CRO 797252 · © {new Date().getFullYear()}</div></footer>
  </div>;
}
