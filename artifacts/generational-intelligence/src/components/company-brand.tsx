export const triskelionLogo = `${import.meta.env.BASE_URL}brand-assets/gi-triskelion-original.png`;

/**
 * The supplied emblem is displayed whole, without image processing or filters.
 * Approved exception: the predominantly white original sits on an evergreen #163F38 box.
 */
export function CompanyBrand({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <span className="inline-flex h-9 w-9 md:h-[42px] md:w-[42px] shrink-0 items-center justify-center rounded-md bg-[#163F38]">
        <img
          src={triskelionLogo}
          alt="Generational Intelligence Triskelion emblem"
          width={1600}
          height={1600}
          className="h-full w-full object-contain"
          decoding="async"
        />
      </span>
      <span
        className={`text-[15px] md:text-base font-semibold leading-tight tracking-[-0.01em] ${
          tone === 'dark' ? 'text-[#F7F6F2]' : 'text-[#171C20]'
        }`}
      >
        Generational Intelligence
      </span>
    </span>
  );
}
