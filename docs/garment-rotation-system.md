# Garment Rotation System

> Last updated: 2026-02-19

## Overview

The homepage displays a device-responsive number of garments (desktop: 3, tablet: 2, mobile: 1) and lets users cycle through all available garments via the "Explore" button. The system implements a **deck-shuffle-without-replacement** algorithm: every valid garment is shown exactly once before any garment repeats.

## Architecture

```
Server (SSR)
  GarmentsDataLoader           → getRandomGarments(3)  [always fetches 3 for desktop baseline]
        ↓
  GarmentsProvider             → receives initialGarments, sets up client state
        ↓
Client (interactive)
  GarmentsContext              → manages garments[], shownSlugsRef, refreshGarments()
  UIElements "Explore" button  → calls refreshGarments()
  GarmentsClient               → renders garments, lazy-loads 3D canvas
```

### Key files

| File | Role |
|---|---|
| `lib/actions/getGarments.ts` | Server action. Fetches from CMS (cached 5 min), filters private fields, applies three-tier random selection. |
| `lib/context/GarmentsContext.tsx` | Client context. Tracks displayed garments, shown-slugs memory, device-responsive count, refresh logic. |
| `lib/components/r3f/GarmentsDataLoader.tsx` | Server component. Fetches initial garments for SSR, handles `?garment=` deep links. |
| `lib/components/r3f/GarmentsClient.tsx` | Client component. Renders 3D canvas, loading screen, toggle buttons. |
| `lib/components/ui-elements/UIElements.tsx` | Client component. Renders Explore button, dialog triggers. |

## How the deck-shuffle works

1. **Memory**: `shownSlugsRef` (a `Set<string>` ref) tracks every garment slug shown to the user since the last cycle reset.
2. **Refresh**: when the user clicks Explore, `refreshGarments()` sends two exclusion lists to the server:
   - `excludeSlugs` — all slugs in `shownSlugsRef` (soft constraint: "try to avoid these")
   - `currentSlugs` — slugs currently on screen (hard constraint: "never return these")
3. **Server selection** uses three-tier priority:
   - **Fresh**: not in `excludeSlugs` or `currentSlugs` — preferred
   - **History**: in `excludeSlugs` but not `currentSlugs` — used when fresh pool is empty (signals cycle completion)
   - **Current**: in `currentSlugs` — absolute last resort (only when total garments < requested count)
4. **Cycle detection**: if the returned garments overlap with `shownSlugsRef`, the deck has been fully cycled. Memory resets to only the new garments, and the next cycle begins.

## Device adjustment (SSR → client)

SSR always fetches 3 garments (desktop baseline). On mobile/tablet the device-adjustment effect in `GarmentsProvider` slices down to the target count. When this happens, `shownSlugsRef` is reset to only the actually displayed garments so that the unused SSR garments remain available for future Explore clicks.

## Filters applied before selection

Garments are filtered in this order inside `getRandomGarments`:

1. **Private fields** — stripped unless user has a valid `ecce_session` cookie (research mode)
2. **`excludeOnHomepage`** — garments flagged in the CMS are removed from the homepage pool (but accessible via direct URL through `getGarmentBySlug`)
3. **Three-tier exclusion** — fresh / history / current as described above

## Known edge case: duplicate garment bug (fixed 2026-02-19)

### Symptom

On mobile, clicking Explore sometimes returned the same garment that was already displayed.

### Root causes

1. **Over-populated exclusion list**: SSR loaded 3 garments, mobile sliced to 1, but `shownSlugsRef` still contained all 3 SSR slugs. Two garments the user never saw were "wasted" — excluded without being shown. This artificially shrank the available pool and caused premature cycle exhaustion.

2. **No hard exclusion for current garment**: when the deck was exhausted and the server fell back to picking from the excluded list, there was no distinction between "seen earlier" and "currently on screen." The server could randomly return the garment already displayed.

### Fix

1. **Three-tier server selection** (`getGarments.ts`): added `currentSlugs` parameter. The server now separates garments into fresh → history → current tiers and only falls back to the current garment as an absolute last resort.

2. **Device adjustment resets memory** (`GarmentsContext.tsx`): when garments are sliced for a smaller device, `shownSlugsRef` is reset to only the displayed garments so the unused SSR garments stay in the available pool.

3. **`refreshGarments` passes current slugs** (`GarmentsContext.tsx`): the currently displayed garment slugs are extracted and sent as the hard-exclusion list on every refresh call.

## Modifying this system

If you need to change the rotation logic, keep these invariants in mind:

- `shownSlugsRef` must always reflect garments the user has actually seen on the current device, not garments loaded but never displayed.
- The currently displayed garment(s) must always be hard-excluded from server responses to prevent visual no-ops on Explore clicks.
- The `getRandomGarments` signature is backward-compatible (`currentSlugs` defaults to `[]`), so callers like `GarmentsDataLoader` that don't need hard exclusion work without changes.
- The Explore button is disabled via `isPending` during transitions, preventing race conditions from rapid clicks.
