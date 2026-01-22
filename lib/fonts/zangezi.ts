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
    // Defer italic variant - load only when needed
    // {
    //   path: "./Zangezi/Zangezi08-Italic.woff2",
    //   weight: "400",
    //   style: "italic",
    // },
  ],
  variable: "--font-zangezi",
  display: "swap", // Critical: don't block rendering
  fallback: ["serif", "system-ui"], // Fast fallback fonts
  preload: false, // Defer font preload to avoid blocking initial render
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

