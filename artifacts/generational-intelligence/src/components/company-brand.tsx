export const triskelionLogo = `${import.meta.env.BASE_URL}brand-assets/gi-triskelion-original.png`;

/** The supplied emblem is displayed whole, without image processing or filters. */
export function CompanyBrand() {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 sm:gap-3">
      <img
        src={triskelionLogo}
        alt="Generational Intelligence Triskelion emblem"
        width={1600}
        height={1600}
        className="h-14 w-14 shrink-0 object-contain"
        decoding="async"
      />
      <span className="text-[15px] sm:text-base font-medium leading-tight tracking-tight text-foreground">
        <span className="block">Generational</span>
        <span className="block">Intelligence</span>
      </span>
    </span>
  );
}
