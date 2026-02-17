# Background Image System

## Overview

The homepage supports a full-screen background image fetched from the WordPress CMS. The system uses a **three-state machine** controlled by two toggle buttons: the **Theme Toggle** and the **Aperture Toggle**.

## States

| State | Description |
|---|---|
| **BackgroundImage** | Full-screen blurred background image, logo visible on top, UI themed per CMS setting |
| **LightMode** | Standard light mode, no background image, logo visible |
| **DarkMode** | Standard dark mode, no background image, logo visible |

## State Transitions

```
                    ┌─────────────────────┐
                    │   BackgroundImage    │
                    │  (blurred BG + logo) │
                    └──────┬──────┬───────┘
           Theme Toggle    │      │    Aperture Toggle
           (→ DarkMode)    │      │    (toggles detail overlay)
                           │      │
          ┌────────────────┘      └────────────────┐
          ▼                                        ▼
   ┌─────────────┐                    ┌──────────────────────┐
   │  DarkMode   │◄── Theme Toggle ──►│     LightMode        │
   │  (no BG)    │                    │     (no BG)          │
   └──────┬──────┘                    └──────────┬───────────┘
          │                                      │
          │         Aperture Toggle               │
          └──────► BackgroundImage ◄──────────────┘
```

| Current State | Theme Toggle | Aperture Toggle |
|---|---|---|
| BackgroundImage | → DarkMode | Toggles detail overlay (stays in BackgroundImage) |
| LightMode | → DarkMode | → BackgroundImage |
| DarkMode | → LightMode | → BackgroundImage |

## WordPress CMS Fields

All fields are configured in the **Global Settings** options page in WordPress (ACF).

### `homepageBackgroundImage` (Image field)
The background image itself. Uploaded via the WordPress media library. Use a high-resolution image (at least 1920px wide) for best results on desktop. The image will be displayed with `object-fit: cover` to fill the entire viewport, so it will be cropped as needed.

### `homepageBackgroundImageText` (WYSIWYG field)
HTML text shown in the detail overlay when the user clicks the Aperture toggle in BackgroundImage mode. Supports rich text formatting (bold, links, etc.).

### `homepageBackgroundImageTheme` (Text/Select field)
Controls the theme (dark/light) of UI elements when in BackgroundImage mode. This ensures buttons, icons, and text are visible against the background image.

**Values:**
- `dark` — UI elements use dark mode styling (white text/icons)
- `light` — UI elements use light mode styling (dark text/icons)

**Default:** `dark` (if not set or empty)

**Tip:** Choose based on the image brightness. For a dark/moody image, use `dark`. For a bright/light image, use `light`.

### `homepageBackgroundImagePositioning` (Text field)
Controls the focal point of the background image on **desktop** screens. Maps directly to the CSS `object-position` property.

**Format:** Any valid CSS `object-position` value.

**Common values:**

| Value | Effect |
|---|---|
| `center center` | Centers the image (default if empty) |
| `center top` | Anchors to the top, centers horizontally |
| `center bottom` | Anchors to the bottom, centers horizontally |
| `left center` | Anchors to the left, centers vertically |
| `right center` | Anchors to the right, centers vertically |
| `20% 30%` | 20% from left, 30% from top — fine-tune the focal point |
| `50% 25%` | Centered horizontally, 25% from top — good for portraits |

**How it works:** The image fills the entire screen using `object-fit: cover`. The `object-position` value determines which part of the image stays visible when the image is cropped. Think of it as a "focal point" — the browser will keep this point centered/anchored while cropping excess from the opposite sides.

**Examples:**
- A landscape photo where the subject is on the left → `left center` or `30% center`
- A portrait photo where the face is in the upper third → `center 25%`
- A symmetrical image → `center center`

### `homepageBackgroundImagePositioningMobile` (Text field)
Same format as above, but specifically for **mobile** screens (below 768px width). This is important because mobile screens are portrait-oriented while most images are landscape.

**Default:** Falls back to the desktop `homepageBackgroundImagePositioning` value if empty.

**Why a separate mobile value?**
An image positioned `center center` on desktop may show an unimportant area on a tall mobile screen. The mobile override lets you shift the focal point. For example:
- Desktop: `center center` (shows the full landscape)
- Mobile: `center top` (keeps the sky/top of the subject visible on portrait screens)

## Architecture

### Files

| File | Role |
|---|---|
| `lib/gql/queries/getGlobalSettings.gql` | GraphQL query with all 6 background image fields |
| `lib/gql/__generated__/graphql.ts` | Generated TypeScript types |
| `lib/actions/getGlobalSettings.ts` | Server action `getBackgroundImageData()` |
| `lib/stores/appModeStore.ts` | Zustand store with `backgroundMode` state machine |
| `lib/components/shared/Background.tsx` | Renders blurred BG image + logo |
| `lib/components/shared/BackgroundImageDetailOverlay.tsx` | Unblurred image + text overlay |
| `lib/components/ui-elements/ApertureToggle.tsx` | Toggle button for background/overlay |
| `lib/components/ui-elements/ThemeToggle.tsx` | Theme toggle integrated with state machine |
| `lib/components/ui-elements/UIContentLoader.tsx` | Fetches CMS data on mount |
| `lib/components/r3f/GarmentsClient.tsx` | Wires toggles and overlay into the page |

### Data Flow

1. `UIContentLoader` fetches `getBackgroundImageData()` on idle after mount
2. Result is stored in `appModeStore.backgroundImageData`
3. `Background.tsx` reads from the store to render the blurred image
4. `ThemeToggle` syncs `next-themes` with the store's `backgroundMode`
5. `ApertureToggle` calls `toggleAperture()` to switch modes or show/hide overlay
6. `BackgroundImageDetailOverlay` renders when `isDetailOverlayOpen` is true in `backgroundImage` mode

### Initial Load Behavior

1. Page loads with `backgroundMode: "backgroundImage"` (default in store)
2. `next-themes` `defaultTheme` is `"dark"` (SSR fallback in `layout.tsx`)
3. Once `backgroundImageData` is fetched, `ThemeToggle` syncs the theme to the CMS value (`homepageBackgroundImageTheme`)
4. The blurred background image appears once data is available
