"use server"

import { unstable_cache } from "next/cache"

// ============================================
// TYPES
// ============================================

/**
 * Interest level on a 7-step scale (1 = lowest, 7 = highest)
 */
export type InterestLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * Country engagement data
 */
export interface CountryEngagement {
  country: string
  countryCode: string
  count: number
}

/**
 * Action breakdown by type
 */
export interface ActionBreakdown {
  description: number
  tiktok: number
  provenance: number
  construction: number
  analytics: number
  export: number
}

/**
 * Complete analytics data for a garment
 */
export interface GarmentAnalytics {
  /** Normalized interest score (0-1) */
  interestScore: number
  /** Interest level on 7-step scale */
  interestLevel: InterestLevel
  /** Color hex code for the interest level */
  interestColor: string
  /** Total number of garment selections/views */
  totalViews: number
  /** Total time spent viewing this garment (seconds) */
  totalTimeSpent: number
  /** Average time per view (seconds) */
  avgTimePerView: number
  /** Top 3 countries by engagement */
  topCountries: CountryEngagement[]
  /** Breakdown of actions by type */
  actionBreakdown: ActionBreakdown
  /** Data freshness timestamp */
  lastUpdated: string
}

/**
 * Global analytics metrics used for normalization
 */
interface GlobalMetrics {
  maxViews: number
  maxTimeSpent: number
}

// ============================================
// CONFIGURATION
// ============================================

const POSTHOG_API_HOST = "https://us.posthog.com"
const CACHE_REVALIDATION_SECONDS = 300 // 5 minutes

/**
 * Interest level color mapping (1-7 scale)
 * Gradient from red (low) through yellow (medium) to green (high)
 */
const INTEREST_COLORS: Record<InterestLevel, string> = {
  1: "#ef4444", // red-500
  2: "#f97316", // orange-500
  3: "#eab308", // yellow-500
  4: "#a3e635", // lime-400
  5: "#22c55e", // green-500
  6: "#10b981", // emerald-500
  7: "#059669", // emerald-600
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate interest level from normalized score (0-1)
 */
function calculateInterestLevel(score: number): InterestLevel {
  if (score <= 0.14) return 1
  if (score <= 0.28) return 2
  if (score <= 0.42) return 3
  if (score <= 0.56) return 4
  if (score <= 0.70) return 5
  if (score <= 0.85) return 6
  return 7
}

/**
 * Execute a HogQL query against PostHog API
 */
async function executeHogQLQuery<T>(query: string): Promise<T | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID

  if (!apiKey || !projectId) {
    console.error("PostHog API credentials not configured")
    return null
  }

  try {
    const response = await fetch(`${POSTHOG_API_HOST}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
      }),
    })

    if (!response.ok) {
      console.error(`PostHog API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error("PostHog query failed:", error)
    return null
  }
}

// ============================================
// CACHED QUERY FUNCTIONS
// ============================================

/**
 * Get global metrics for normalization (cached)
 */
const getGlobalMetricsCached = unstable_cache(
  async (): Promise<GlobalMetrics> => {
    const query = `
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
    `

    interface QueryResult {
      results?: Array<[number | null, number | null]>
    }

    const result = await executeHogQLQuery<QueryResult>(query)
    
    if (!result?.results?.[0]) {
      return { maxViews: 1, maxTimeSpent: 1 } // Avoid division by zero
    }

    const [maxViews, maxTimeSpent] = result.results[0]
    return {
      maxViews: Math.max(maxViews ?? 1, 1),
      maxTimeSpent: Math.max(maxTimeSpent ?? 1, 1),
    }
  },
  ["global-garment-metrics"],
  {
    revalidate: CACHE_REVALIDATION_SECONDS,
    tags: ["analytics"],
  }
)

/**
 * Get analytics for a specific garment (cached)
 */
const getGarmentMetricsCached = unstable_cache(
  async (garmentSlug: string) => {
    // Query for views and time spent
    const metricsQuery = `
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
      WHERE properties.garment_slug = '${garmentSlug}'
        AND timestamp > now() - INTERVAL 90 DAY
    `

    // Query for top countries
    const countriesQuery = `
      SELECT
        properties.$geoip_country_name as country,
        properties.$geoip_country_code as country_code,
        count(*) as engagement_count
      FROM events
      WHERE event = 'garment_selected'
        AND properties.garment_slug = '${garmentSlug}'
        AND properties.$geoip_country_name IS NOT NULL
        AND timestamp > now() - INTERVAL 90 DAY
      GROUP BY country, country_code
      ORDER BY engagement_count DESC
      LIMIT 3
    `

    // Query for action breakdown
    const actionsQuery = `
      SELECT
        JSONExtractString(properties, 'action_type') as action_type,
        count(*) as action_count
      FROM events
      WHERE event = 'garment_action_clicked'
        AND properties.garment_slug = '${garmentSlug}'
        AND timestamp > now() - INTERVAL 90 DAY
      GROUP BY action_type
    `

    interface MetricsResult {
      results?: Array<[number | null, number | null, number | null]>
    }

    interface CountriesResult {
      results?: Array<[string | null, string | null, number | null]>
    }

    interface ActionsResult {
      results?: Array<[string | null, number | null]>
    }

    // Execute all queries in parallel
    const [metricsResult, countriesResult, actionsResult] = await Promise.all([
      executeHogQLQuery<MetricsResult>(metricsQuery),
      executeHogQLQuery<CountriesResult>(countriesQuery),
      executeHogQLQuery<ActionsResult>(actionsQuery),
    ])

    // Parse metrics
    const [viewCount, totalTime, avgTime] = metricsResult?.results?.[0] ?? [0, 0, 0]

    // Parse countries
    const topCountries: CountryEngagement[] = (countriesResult?.results ?? [])
      .filter((row): row is [string, string, number] => 
        row[0] !== null && row[1] !== null && row[2] !== null
      )
      .map(([country, countryCode, count]) => ({
        country,
        countryCode,
        count,
      }))

    // Parse action breakdown
    const actionBreakdown: ActionBreakdown = {
      description: 0,
      tiktok: 0,
      provenance: 0,
      construction: 0,
      analytics: 0,
      export: 0,
    }

    for (const row of actionsResult?.results ?? []) {
      const [actionType, count] = row
      if (actionType && count && actionType in actionBreakdown) {
        actionBreakdown[actionType as keyof ActionBreakdown] = count
      }
    }

    return {
      totalViews: viewCount ?? 0,
      totalTimeSpent: totalTime ?? 0,
      avgTimePerView: avgTime ?? 0,
      topCountries,
      actionBreakdown,
    }
  },
  ["garment-metrics"],
  {
    revalidate: CACHE_REVALIDATION_SECONDS,
    tags: ["analytics"],
  }
)

// ============================================
// PUBLIC API
// ============================================

/**
 * Get complete analytics data for a specific garment
 * 
 * @param garmentSlug - Unique identifier for the garment
 * @returns Complete analytics data including interest score, views, time, countries, and actions
 */
export async function getGarmentAnalytics(garmentSlug: string): Promise<GarmentAnalytics> {
  // Fetch data in parallel
  const [globalMetrics, garmentMetrics] = await Promise.all([
    getGlobalMetricsCached(),
    getGarmentMetricsCached(garmentSlug),
  ])

  // Calculate normalized interest score
  // Weight: 40% views, 60% time spent (time indicates deeper engagement)
  const normalizedViews = garmentMetrics.totalViews / globalMetrics.maxViews
  const normalizedTime = garmentMetrics.totalTimeSpent / globalMetrics.maxTimeSpent
  const interestScore = normalizedViews * 0.4 + normalizedTime * 0.6

  // Clamp to 0-1 range
  const clampedScore = Math.max(0, Math.min(1, interestScore))

  // Calculate interest level
  const interestLevel = calculateInterestLevel(clampedScore)
  const interestColor = INTEREST_COLORS[interestLevel]

  return {
    interestScore: Math.round(clampedScore * 100) / 100,
    interestLevel,
    interestColor,
    totalViews: garmentMetrics.totalViews,
    totalTimeSpent: Math.round(garmentMetrics.totalTimeSpent),
    avgTimePerView: Math.round(garmentMetrics.avgTimePerView),
    topCountries: garmentMetrics.topCountries,
    actionBreakdown: garmentMetrics.actionBreakdown,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get analytics summary for multiple garments
 * Useful for comparison views or dashboards
 * 
 * @param garmentSlugs - Array of garment slugs to fetch
 * @returns Map of slug to analytics data
 */
export async function getMultipleGarmentAnalytics(
  garmentSlugs: string[]
): Promise<Map<string, GarmentAnalytics>> {
  const results = await Promise.all(
    garmentSlugs.map(async (slug) => {
      const analytics = await getGarmentAnalytics(slug)
      return [slug, analytics] as const
    })
  )

  return new Map(results)
}
