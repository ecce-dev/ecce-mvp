import localFont from "next/font/local";

/**
 * Zangezi font family configuration
 * A distinctive display typeface with multiple weights and styles
 */
export const zangezi = localFont({
  src: [
    {
      path: "./Zangezi/Zangezi08-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./Zangezi/Zangezi08-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./Zangezi/Zangezi08-SemiLight.woff2",
      weight: "350",
      style: "normal",
    },
    {
      path: "./Zangezi/Zangezi08-SemiLightItalic.woff2",
      weight: "350",
      style: "italic",
    },
    {
      path: "./Zangezi/Zangezi08-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Zangezi/Zangezi08-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-zangezi",
  display: "swap",
  fallback: ["serif"],
});

/**
 * Zangezi Condensed variant - for when you specifically need the condensed style
 */
export const zangeziCondensed = localFont({
  src: "./Zangezi/Zangezi08-Condensed.woff2",
  variable: "--font-zangezi-condensed",
  display: "swap",
  fallback: ["serif"],
});

