# ECCE Analytics System Documentation

This document describes the PostHog analytics implementation for tracking garment engagement in the ECCE platform. It serves as a reference for understanding the data structure, processing logic, and how to make modifications.

## Table of Contents

1. [Overview](#overview)
2. [Events Tracked](#events-tracked)
3. [Data Structure](#data-structure)
4. [Implementation Details](#implementation-details)
5. [PostHog Configuration](#posthog-configuration)
6. [Querying Analytics Data](#querying-analytics-data)
7. [Interest Score Calculation](#interest-score-calculation)
8. [Modifying the System](#modifying-the-system)

---

## Overview

The analytics system tracks user engagement with garments in both **public** and **research** modes. Key metrics include:

- **Garment selections/views** - When users click on a garment
- **Session duration** - Time spent viewing each garment
- **Action interactions** - Clicks on Description, TikTok, Provenance, etc.
- **Geographic data** - Country of origin for visitors (auto-captured by PostHog)

This data is aggregated to calculate an **Interest Score** displayed in the Analytics dialog for research users.

---

## Events Tracked

### 1. `garment_selected`

Fired when a user clicks/selects a garment to view.

| Property | Type | Description |
|----------|------|-------------|
| `garment_slug` | string | Unique identifier for the garment |
| `garment_name` | string | Display name of the garment |
| `mode` | `"public"` \| `"research"` | Current view mode |
| `user_role` | `"curator"` \| `"designer"` \| `"vc"` \| `null` | Authenticated user role (null for anonymous) |

**User Roles:**
- `curator` - Authenticated as curator
- `designer` - Authenticated as designer
- `vc` - Authenticated as VC/investor
- `null` - Anonymous/unauthenticated user

**Auto-captured by PostHog:**
- `$geoip_country_code`
- `$geoip_country_name`
- Device info, browser, OS, etc.

### 2. `garment_session_ended`

Fired when a user stops viewing a garment (switches to another or deselects).

| Property | Type | Description |
|----------|------|-------------|
| `garment_slug` | string | Unique identifier for the garment |
| `garment_name` | string | Display name of the garment |
| `mode` | `"public"` \| `"research"` | View mode during the session |
| `user_role` | `"curator"` \| `"designer"` \| `"vc"` \| `null` | Authenticated user role |
| `duration_seconds` | number | Time spent viewing (rounded to 2 decimals) |

**Trigger conditions:**
- User selects a different garment
- User deselects the current garment (back button)
- User navigates away from the page
- User closes the browser tab
- Page visibility changes (tab becomes hidden)

### 3. `garment_action_clicked`

Fired when a user clicks on a specific action/CTA for a garment.

| Property | Type | Description |
|----------|------|-------------|
| `garment_slug` | string | Unique identifier for the garment |
| `garment_name` | string | Display name of the garment |
| `mode` | `"public"` \| `"research"` | Current view mode |
| `user_role` | `"curator"` \| `"designer"` \| `"vc"` \| `null` | Authenticated user role |
| `action_type` | string | Type of action clicked |

**Action types:**
- `description` - Description dialog opened
- `tiktok` - Try via TikTok button clicked
- `provenance` - Provenance dialog opened (research only)
- `construction` - Construction dialog opened (research only)
- `analytics` - Analytics dialog opened (research only)
- `export` - Export dialog opened (research only)

---

## Data Structure

### Client-Side Types

```typescript
// lib/analytics/tracking.ts

type AnalyticsMode = "public" | "research"

type AnalyticsUserRole = "curator" | "designer" | "vc" | null

type GarmentActionType = 
  | "description"
  | "tiktok"
  | "provenance"
  | "construction"
  | "analytics"
  | "export"

interface GarmentSession {
  garmentSlug: string
  garmentName: string
  mode: AnalyticsMode
  userRole: AnalyticsUserRole
  startTime: number
}
```

### Server-Side Types

```typescript
// lib/actions/getGarmentAnalytics.ts

type InterestLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface CountryEngagement {
  country: string
  countryCode: string
  count: number
}

interface ActionBreakdown {
  description: number
  tiktok: number
  provenance: number
  construction: number
  analytics: number
  export: number
}

interface GarmentAnalytics {
  interestScore: number      // 0-1 normalized
  interestLevel: InterestLevel
  interestColor: string      // Hex color code
  totalViews: number
  totalTimeSpent: number     // seconds
  avgTimePerView: number     // seconds
  topCountries: CountryEngagement[]
  actionBreakdown: ActionBreakdown
  lastUpdated: string        // ISO timestamp
}
```

---

## Implementation Details

### File Structure

```
lib/
├── analytics/
│   ├── index.ts                      # Module exports
│   ├── tracking.ts                   # Event tracking functions
│   └── useGarmentSessionTracking.ts  # React hook for session tracking
├── actions/
│   └── getGarmentAnalytics.ts        # Server action for querying PostHog
└── components/
    ├── AnalyticsUI.tsx               # Analytics and Export dialog content components
    ├── UIElementsShared.tsx          # TrackedDialogTrigger, TikTokTrigger, shared UI elements
    ├── UIElementsPublic.tsx          # Public mode UI (uses tracked triggers)
    └── UIElementsResearch.tsx        # Research mode UI (uses tracked triggers)
```

### Tracking Flow

1. **Session Tracking Hook** (`useGarmentSessionTracking`)
   - Called in `UIElementsPublic` and `UIElementsResearch`
   - Automatically tracks garment selection and session duration
   - Handles page visibility changes and beforeunload events

2. **Tracked Triggers** (`TrackedDialogTrigger`, `TikTokTrigger`)
   - Wrap the base ECCE triggers with analytics tracking
   - Fire `garment_action_clicked` event on click

3. **Analytics Display** (`AnalyticsDialogContent` in `AnalyticsUI.tsx`)
   - Fetches data via `getGarmentAnalytics` server action
   - Displays interest meter, metrics, and top countries

4. **Export Display** (`ExportDialogContent` in `AnalyticsUI.tsx`)
   - Pattern preview with invert toggle
   - Download functionality with tracking

---

## PostHog Configuration

### Required Environment Variables

```env
# PostHog API key for server-side queries
POSTHOG_PERSONAL_API_KEY=phx_...

# PostHog project ID
POSTHOG_PROJECT_ID=12345

# Client-side PostHog key (already configured)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

### PostHog Dashboard Setup

#### Recommended Insights to Create

1. **Garment Views Over Time**
   - Type: Trends
   - Event: `garment_selected`
   - Breakdown: `garment_slug`

2. **Average Session Duration by Garment**
   - Type: Trends
   - Event: `garment_session_ended`
   - Math: Average of `duration_seconds`
   - Breakdown: `garment_slug`

3. **Action Funnel**
   - Type: Funnel
   - Steps: `garment_selected` → `garment_action_clicked` (any)
   - Breakdown: `action_type`

4. **Geographic Distribution**
   - Type: Trends
   - Event: `garment_selected`
   - Breakdown: `$geoip_country_name`

---

## Querying Analytics Data

### HogQL Queries Used

#### Get Global Metrics (for normalization)

```sql
SELECT
  max(view_count) as max_views,
  max(time_spent) as max_time
FROM (
  SELECT
    properties.garment_slug as slug,
    countIf(event = 'garment_selected') as view_count,
    sumIf(
      toFloat64OrNull(JSONExtractString(properties, 'duration_seconds')),
      event = 'garment_session_ended'
    ) as time_spent
  FROM events
  WHERE event IN ('garment_selected', 'garment_session_ended')
    AND properties.garment_slug IS NOT NULL
    AND timestamp > now() - INTERVAL 90 DAY
  GROUP BY properties.garment_slug
)
```

#### Get Garment Metrics

```sql
SELECT
  countIf(event = 'garment_selected') as view_count,
  sumIf(
    toFloat64OrNull(JSONExtractString(properties, 'duration_seconds')),
    event = 'garment_session_ended'
  ) as total_time,
  avgIf(
    toFloat64OrNull(JSONExtractString(properties, 'duration_seconds')),
    event = 'garment_session_ended'
  ) as avg_time
FROM events
WHERE properties.garment_slug = '{garmentSlug}'
  AND timestamp > now() - INTERVAL 90 DAY
```

#### Get Top Countries

```sql
SELECT
  properties.$geoip_country_name as country,
  properties.$geoip_country_code as country_code,
  count(*) as engagement_count
FROM events
WHERE event = 'garment_selected'
  AND properties.garment_slug = '{garmentSlug}'
  AND properties.$geoip_country_name IS NOT NULL
  AND timestamp > now() - INTERVAL 90 DAY
GROUP BY country, country_code
ORDER BY engagement_count DESC
LIMIT 3
```

#### Get Action Breakdown

```sql
SELECT
  JSONExtractString(properties, 'action_type') as action_type,
  count(*) as action_count
FROM events
WHERE event = 'garment_action_clicked'
  AND properties.garment_slug = '{garmentSlug}'
  AND timestamp > now() - INTERVAL 90 DAY
GROUP BY action_type
```

---

## Interest Score Calculation

The Interest Score is a normalized metric (0-1) that combines view count and time spent.

### Formula

```
interest_score = (normalized_views * 0.4) + (normalized_time * 0.6)
```

Where:
- `normalized_views = garment_views / max_views_across_all_garments`
- `normalized_time = garment_time_spent / max_time_spent_across_all_garments`

### Weighting Rationale

- **40% Views**: Indicates initial interest/discovery
- **60% Time Spent**: Indicates deeper engagement (more valuable signal)

### Interest Level Mapping

| Score Range | Level | Label | Color |
|-------------|-------|-------|-------|
| 0.00 - 0.14 | 1 | Very Low | `#ef4444` (red) |
| 0.15 - 0.28 | 2 | Low | `#f97316` (orange) |
| 0.29 - 0.42 | 3 | Low-Medium | `#eab308` (yellow) |
| 0.43 - 0.56 | 4 | Medium | `#a3e635` (lime) |
| 0.57 - 0.70 | 5 | Medium-High | `#22c55e` (green) |
| 0.71 - 0.85 | 6 | High | `#10b981` (emerald) |
| 0.86 - 1.00 | 7 | Very High | `#059669` (dark emerald) |

---

## Modifying the System

### Adding a New Action Type

1. **Update the type definition** in `lib/analytics/tracking.ts`:
   ```typescript
   type GarmentActionType = 
     | "description"
     | "tiktok"
     // ... existing types
     | "new_action" // Add new type
   ```

2. **Update the action breakdown interface** in `lib/actions/getGarmentAnalytics.ts`:
   ```typescript
   interface ActionBreakdown {
     // ... existing
     new_action: number
   }
   ```

3. **Create a tracked trigger** for the new action in the UI component.

### Changing the Interest Score Formula

Modify `getGarmentAnalytics` in `lib/actions/getGarmentAnalytics.ts`:

```typescript
// Current formula (40% views, 60% time)
const interestScore = normalizedViews * 0.4 + normalizedTime * 0.6

// Example: Equal weighting
const interestScore = normalizedViews * 0.5 + normalizedTime * 0.5

// Example: Add action count
const normalizedActions = totalActions / maxActions
const interestScore = normalizedViews * 0.3 + normalizedTime * 0.4 + normalizedActions * 0.3
```

### Changing the Time Window

The default lookback window is 90 days. To change it, modify the SQL queries in `getGarmentAnalytics.ts`:

```sql
-- Change from 90 days to 30 days
WHERE timestamp > now() - INTERVAL 30 DAY
```

### Adding New Metrics

1. **Create a new HogQL query** in `getGarmentAnalytics.ts`
2. **Add the field to `GarmentAnalytics` interface**
3. **Update the `AnalyticsDialogContent` component** to display the new metric

### Caching Configuration

Analytics data is cached for 5 minutes (300 seconds). To change:

```typescript
// lib/actions/getGarmentAnalytics.ts
const CACHE_REVALIDATION_SECONDS = 300 // Change this value
```

---

## Troubleshooting

### No Data Showing

1. **Check PostHog credentials** - Verify `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` are set
2. **Check event capture** - Use PostHog's Live Events view to verify events are being sent
3. **Check console errors** - Server action may be logging errors

### Data Not Updating

1. **Cache invalidation** - Data is cached for 5 minutes
2. **Force refresh** - Clear Next.js cache or wait for cache expiration

### Interest Score Always Zero

1. **No events yet** - The garment may have no recorded interactions
2. **Events not being captured** - Verify `useGarmentSessionTracking` hook is being called

---

## API Reference

### Server Actions

#### `getGarmentAnalytics(garmentSlug: string): Promise<GarmentAnalytics>`

Fetches complete analytics data for a specific garment.

#### `getMultipleGarmentAnalytics(slugs: string[]): Promise<Map<string, GarmentAnalytics>>`

Fetches analytics data for multiple garments in parallel.

### Client Functions

#### `trackGarmentSelected(slug, name, mode, userRole?): void`
Track a garment selection event.
- `userRole` - Optional: "curator" | "designer" | "vc" | null

#### `trackGarmentSessionEnded(slug, name, mode, userRole, durationSeconds): void`
Track the end of a garment viewing session.
- `userRole` - "curator" | "designer" | "vc" | null

#### `trackGarmentActionClicked(slug, name, mode, userRole, actionType): void`
Track a click on a specific action.
- `userRole` - "curator" | "designer" | "vc" | null

#### `startGarmentSession(slug, name, mode, userRole?): GarmentSession`
Start tracking a new garment session.
- `userRole` - Optional: "curator" | "designer" | "vc" | null

#### `endGarmentSession(session): void`
End a garment session and send the duration event (includes userRole from session).

### React Hooks

#### `useGarmentSessionTracking(): void`
Automatically tracks garment selection and session duration. Call once in the garment view root component.

---

## Security Considerations

- **API Key Storage**: The `POSTHOG_PERSONAL_API_KEY` should never be exposed to the client. It's only used in server actions.
- **Query Injection**: Garment slugs are passed directly to HogQL queries. Ensure slugs are validated/sanitized before use.
- **Rate Limiting**: PostHog API has rate limits. The caching layer helps mitigate this.
