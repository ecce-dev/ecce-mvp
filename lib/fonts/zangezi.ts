import localFont from "next/font/local";

/**
 * Zangezi font family configuration
 * A distinctive display typeface with multiple weights and styles
 */
export const zangezi = localFont({
  src: [
    {
      path: "./Zangezi/Zangezi08-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    // Only load italic variant if needed - defer others
    {
      path: "./Zangezi/Zangezi08-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-zangezi",
  display: "swap", // Critical: don't block rendering
  fallback: ["serif"],
  preload: true, // Preload only the regular weight
});

/**
 * Zangezi Condensed variant - for when you specifically need the condensed style
 */
export const zangeziCondensed = localFont({
  src: "./Zangezi/Zangezi08-Condensed.woff2",
  variable: "--font-zangezi-condensed",
  display: "swap", // Critical: don't block rendering
  fallback: ["serif"],
  preload: false, // Defer condensed - likely not used on initial render
});

