export const triskelionLogo = import.meta.env.BASE_URL + 'brand-assets/gi-triskelion-original.png';
export function CompanyBrand() {
  return <span className="gi-brand"><span className="gi-mark">
    <img src={triskelionLogo} alt="Generational Intelligence triskelion" width={48} height={48}/>
  </span><span className="gi-wordmark"><strong>Generational Intelligence</strong><small>Limited</small></span></span>;
}
