# ECCE Analytics - Engineering Guide

Technical documentation for engineers working on the analytics system.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │ useGarmentSession    │    │ TrackedDialogTrigger /       │   │
│  │ Tracking (hook)      │    │ TikTokTrigger (components)   │   │
│  └──────────┬───────────┘    └──────────────┬───────────────┘   │
│             │                               │                    │
│             ▼                               ▼                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              lib/analytics/tracking.ts                    │   │
│  │  - trackGarmentSelected()                                 │   │
│  │  - trackGarmentSessionEnded()                             │   │
│  │  - trackGarmentActionClicked()                            │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ posthog.capture()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         POSTHOG                                  │
│  - Stores all events                                            │
│  - Auto-captures geo, device, browser                           │
│  - Provides query API                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HogQL Query API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER (Next.js Server Action)                 │
├─────────────────────────────────────────────────────────────────┤
│  lib/actions/getGarmentAnalytics.ts                             │
│  - Executes HogQL queries                                       │
│  - Calculates interest scores                                   │
│  - Caches results (5 min)                                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT (Analytics UI)                          │
│  lib/components/AnalyticsUI.tsx                                 │
│  - AnalyticsDialogContent                                       │
│  - ExportDialogContent                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
lib/
├── analytics/
│   ├── index.ts                      # Public exports
│   ├── tracking.ts                   # Event capture functions
│   └── useGarmentSessionTracking.ts  # React hook for auto-tracking
│
├── actions/
│   └── getGarmentAnalytics.ts        # Server action (PostHog queries)
│
└── components/
    ├── AnalyticsUI.tsx               # Analytics/Export dialog components
    ├── UIElementsShared.tsx          # TrackedDialogTrigger, TikTokTrigger
    ├── UIElementsPublic.tsx          # Public mode (uses tracking)
    └── UIElementsResearch.tsx        # Research mode (uses tracking)
```

---

## Event Schema

### garment_selected

```typescript
interface GarmentSelectedEvent {
  event: "garment_selected"
  properties: {
    garment_slug: string      // e.g., "summer-dress-2024"
    garment_name: string      // e.g., "Summer Dress"
    mode: "public" | "research"
    user_role: "curator" | "designer" | "vc" | null
    // Auto-captured by PostHog:
    $geoip_country_code: string
    $geoip_country_name: string
    $device_type: string
    $browser: string
    // ... etc
  }
}
```

### garment_session_ended

```typescript
interface GarmentSessionEndedEvent {
  event: "garment_session_ended"
  properties: {
    garment_slug: string
    garment_name: string
    mode: "public" | "research"
    user_role: "curator" | "designer" | "vc" | null
    duration_seconds: number  // e.g., 45.32
  }
}
```

### garment_action_clicked

```typescript
interface GarmentActionClickedEvent {
  event: "garment_action_clicked"
  properties: {
    garment_slug: string
    garment_name: string
    mode: "public" | "research"
    user_role: "curator" | "designer" | "vc" | null
    action_type: "description" | "tiktok" | "provenance" | 
                 "construction" | "analytics" | "export"
  }
}
```

---

## Core Implementation

### Session Tracking Hook

```typescript
// lib/analytics/useGarmentSessionTracking.ts

export function useGarmentSessionTracking(): void {
  const selectedGarment = useAppModeStore((state) => state.selectedGarment)
  const viewMode = useAppModeStore((state) => state.viewMode)
  const userRole = useAppModeStore((state) => state.userRole)
  
  const sessionRef = useRef<GarmentSession | null>(null)
  const prevGarmentSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const currentSlug = selectedGarment?.slug ?? null
    const garmentChanged = currentSlug !== prevGarmentSlugRef.current
    
    if (garmentChanged) {
      // End previous session
      if (sessionRef.current) {
        endGarmentSession(sessionRef.current)
      }
      
      // Start new session
      if (currentSlug) {
        trackGarmentSelected(currentSlug, currentName, mode, role)
        sessionRef.current = startGarmentSession(currentSlug, currentName, mode, role)
      }
      
      prevGarmentSlugRef.current = currentSlug
    }
  }, [selectedGarment, viewMode, userRole])

  // Also handles:
  // - Component unmount
  // - Page visibility changes (tab hidden/visible)
  // - beforeunload (tab close/navigation)
}
```

### Tracked Trigger Component

```typescript
// lib/components/UIElementsShared.tsx

export function TrackedDialogTrigger({ 
  dialogId, 
  label, 
  garmentSlug, 
  garmentName, 
  mode,
  userRole = null,
}: TrackedDialogTriggerProps) {
  const handleClick = () => {
    posthog.capture("garment_action_clicked", {
      garment_slug: garmentSlug,
      garment_name: garmentName,
      mode,
      user_role: userRole,
      action_type: dialogId,
    })
  }

  return (
    <EcceDialogTrigger
      dialogId={dialogId}
      variant="secondary"
      className="pointer-events-auto"
      onClick={handleClick}
    >
      {label}
    </EcceDialogTrigger>
  )
}
```

### Server Action for Querying

```typescript
// lib/actions/getGarmentAnalytics.ts

export async function getGarmentAnalytics(garmentSlug: string): Promise<GarmentAnalytics> {
  // Fetch in parallel
  const [globalMetrics, garmentMetrics] = await Promise.all([
    getGlobalMetricsCached(),      // Max values for normalization
    getGarmentMetricsCached(garmentSlug),  // This garment's data
  ])

  // Calculate normalized score
  const normalizedViews = garmentMetrics.totalViews / globalMetrics.maxViews
  const normalizedTime = garmentMetrics.totalTimeSpent / globalMetrics.maxTimeSpent
  const interestScore = normalizedViews * 0.4 + normalizedTime * 0.6

  return {
    interestScore,
    interestLevel: calculateInterestLevel(interestScore),
    interestColor: INTEREST_COLORS[interestLevel],
    totalViews: garmentMetrics.totalViews,
    totalTimeSpent: garmentMetrics.totalTimeSpent,
    avgTimePerView: garmentMetrics.avgTimePerView,
    topCountries: garmentMetrics.topCountries,
    actionBreakdown: garmentMetrics.actionBreakdown,
    lastUpdated: new Date().toISOString(),
  }
}
```

---

## HogQL Query Reference

### Executing Queries

```typescript
async function executeHogQLQuery<T>(query: string): Promise<T | null> {
  const response = await fetch(
    `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
      }),
    }
  )
  return response.json()
}
```

### Query: Global Max Values

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

### Query: Garment Metrics

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

### Query: Top Countries

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

### Query: Action Breakdown

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

## Caching Strategy

```typescript
// lib/actions/getGarmentAnalytics.ts

const CACHE_REVALIDATION_SECONDS = 300 // 5 minutes

const getGlobalMetricsCached = unstable_cache(
  async (): Promise<GlobalMetrics> => {
    // Query implementation
  },
  ["global-garment-metrics"],
  {
    revalidate: CACHE_REVALIDATION_SECONDS,
    tags: ["analytics"],
  }
)

const getGarmentMetricsCached = unstable_cache(
  async (garmentSlug: string) => {
    // Query implementation
  },
  ["garment-metrics"],
  {
    revalidate: CACHE_REVALIDATION_SECONDS,
    tags: ["analytics"],
  }
)
```

**Cache invalidation:**
- Automatic after 5 minutes
- Manual: `revalidateTag("analytics")` from a server action

---

## Environment Variables

```env
# Required for server-side queries
POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxxxxxxxxxxxxxx
POSTHOG_PROJECT_ID=12345

# Already configured for client-side tracking
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
```

### API Key Permissions Required

| Scope | Access | Purpose |
|-------|--------|---------|
| Query | Read | Execute HogQL queries |
| Project | Read | Access project data |

---

## Adding New Tracking

### 1. New Event Type

```typescript
// lib/analytics/tracking.ts

export function trackNewEvent(
  garmentSlug: string,
  garmentName: string,
  mode: AnalyticsMode,
  userRole: AnalyticsUserRole,
  customProperty: string
): void {
  posthog.capture("garment_new_event", {
    garment_slug: garmentSlug,
    garment_name: garmentName,
    mode,
    user_role: userRole,
    custom_property: customProperty,
  })
}
```

### 2. New Action Type

```typescript
// lib/analytics/tracking.ts

type GarmentActionType = 
  | "description"
  | "tiktok"
  // ... existing
  | "new_action"  // Add here

// lib/actions/getGarmentAnalytics.ts

interface ActionBreakdown {
  // ... existing
  new_action: number  // Add here
}
```

### 3. New Metric in Analytics Display

```typescript
// lib/actions/getGarmentAnalytics.ts

interface GarmentAnalytics {
  // ... existing
  newMetric: number  // Add here
}

// Add query in getGarmentMetricsCached
// Update AnalyticsDialogContent to display it
```

---

## Testing

### Verify Events in PostHog

1. Go to PostHog → Activity → Live Events
2. Interact with the site
3. Confirm events appear with correct properties

### Test Session Tracking

| Action | Expected Event |
|--------|----------------|
| Click garment | `garment_selected` |
| Click different garment | `garment_session_ended` for first, `garment_selected` for second |
| Click back button | `garment_session_ended` |
| Switch browser tab | `garment_session_ended`, then new session when tab returns |
| Close tab | `garment_session_ended` (via beforeunload) |

### Test HogQL Queries

Use PostHog's SQL editor (Data → SQL) to test queries before implementation.

---

## Error Handling

```typescript
// lib/actions/getGarmentAnalytics.ts

async function executeHogQLQuery<T>(query: string): Promise<T | null> {
  try {
    const response = await fetch(...)
    
    if (!response.ok) {
      console.error(`PostHog API error: ${response.status}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error("PostHog query failed:", error)
    return null
  }
}
```

**Fallback behavior:**
- If queries fail, analytics show loading/error state
- Main app functionality is unaffected
- Tracking continues to work (capture is fire-and-forget)

---

## Security Considerations

1. **API Key Protection**
   - `POSTHOG_PERSONAL_API_KEY` is server-only
   - Never expose in client bundles
   - Use server actions for all queries

2. **Query Injection**
   - Garment slugs are interpolated into SQL
   - Validate slugs contain only safe characters
   - Consider parameterized queries for future

3. **Rate Limiting**
   - PostHog has API rate limits
   - Caching reduces query frequency
   - Consider request batching for high traffic

---

## Debugging

### Check if tracking is initialized

```javascript
// In browser console
posthog.isFeatureEnabled('some-feature')  // Should not error
posthog.capture('test_event')  // Should appear in Live Events
```

### Check server action execution

```typescript
// Add logging in getGarmentAnalytics.ts
console.log('Fetching analytics for:', garmentSlug)
console.log('Query result:', result)
```

### Verify cache behavior

```typescript
// Check cache headers in network tab
// Or add timestamp to response to see freshness
lastUpdated: new Date().toISOString()
```

---

## Performance Considerations

1. **Query Performance**
   - Queries run against 90-day window by default
   - Consider reducing for high-volume events
   - Use appropriate indexes in PostHog

2. **Caching**
   - 5-minute cache balances freshness vs. performance
   - Adjust based on traffic patterns
   - Consider longer cache for stable metrics

3. **Parallel Fetching**
   - Global metrics and garment metrics fetched in parallel
   - Reduces total response time

4. **Client-Side Tracking**
   - Events are batched by PostHog client
   - No blocking on user interactions
