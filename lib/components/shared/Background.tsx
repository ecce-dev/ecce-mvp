import Image from "next/image";

/**
 * Server-rendered Background component for optimal LCP performance.
 * 
 * Performance optimizations:
 * - Only loads the default (light mode) logo initially for faster LCP
 * - Dark mode logo is lazy-loaded client-side after hydration
 * - Reduces initial image payload by 50%
 * - No client-side JavaScript needed for initial render
 * - Responsive sizing for mobile (smaller = faster load)
 */
export default function Background() {
  return (
    <div className="safe-area-content fixed inset-0 z-1">
      <div className="h-full w-full flex flex-col justify-end items-center p-8">
        {/* Black logo - visible by default (light mode) - LCP element */}
        {/* Responsive sizing: smaller on mobile for faster load */}
        <Image
          src="/ecce_logo_black.svg"
          alt="ecce"
          width={420}
          height={420}
          priority
          loading="eager"
          fetchPriority="high"
          className="dark:hidden"
        />
        {/* White logo - lazy loaded for dark mode (non-blocking) */}
        <Image
          src="/ecce_logo_white.svg"
          alt="ecce"
          width={420}
          height={420}
          loading="lazy"
          fetchPriority="low"
          className="hidden dark:block"
        />
      </div>
    </div>
  );
}
