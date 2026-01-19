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
  // count: number
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
  /** Normalized interest score (0-100) for percentage */
  interestScore: number
  /** Interest level on 7-step scale */
  interestLevel: InterestLevel
  /** Color hex code for the interest level */
  // interestColor: string
  /** Total number of garment selections/views */
  // totalViews: number
  /** Total time spent viewing this garment (seconds) */
  // totalTimeSpent: number
  /** Average time per view (seconds) */
  // avgTimePerView: number
  /** Top 3 countries by engagement */
  topCountries: CountryEngagement[]
  /** Breakdown of actions by type */
  // actionBreakdown: ActionBreakdown
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
const CACHE_REVALIDATION_SECONDS = 2520 // 42 minutes - aggressive caching to reduce API calls
const MAX_RETRY_ATTEMPTS = 3 // Maximum number of retry attempts for rate-limited requests

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
 * Sleep for a specified number of seconds
 */
function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

/**
 * Execute a fetch request with retry logic for rate limiting
 * Handles 429 errors by reading retry-after header and waiting before retrying
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt: number = 1
): Promise<Response> {
  const response = await fetch(url, options)

  // Handle rate limiting (429) with retry-after header
  if (response.status === 429 && attempt < MAX_RETRY_ATTEMPTS) {
    const retryAfterHeader = response.headers.get("retry-after")
    const retryAfterSeconds = retryAfterHeader
      ? parseInt(retryAfterHeader, 10)
      : 60 // Default to 60 seconds if header is missing or invalid

    if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
      console.warn(
        `PostHog rate limited (429) but invalid retry-after header: "${retryAfterHeader}". Using default 60s.`
      )
    }

    const waitTime = isNaN(retryAfterSeconds) || retryAfterSeconds <= 0 ? 60 : retryAfterSeconds

    if (process.env.NODE_ENV === "development") {
      console.log(
        `PostHog rate limited (429). Waiting ${waitTime}s before retry (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`
      )
    }

    // Wait for the specified retry-after duration
    await sleep(waitTime)

    // Retry the request
    return fetchWithRetry(url, options, attempt + 1)
  }

  return response
}

/**
 * Execute a HogQL query against PostHog API with retry logic for rate limiting
 * 
 * @param query - HogQL query string
 * @returns Query result or null if failed
 */
async function executeHogQLQuery<T>(query: string): Promise<T | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID

  if (!apiKey || !projectId) {
    console.error("PostHog API credentials not configured")
    return null
  }

  const url = `${POSTHOG_API_HOST}/api/projects/${projectId}/query/`
  const options: RequestInit = {
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
  }

  try {
    const response = await fetchWithRetry(url, options)

    // Handle non-429 errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      
      if (response.status === 429) {
        console.error(
          `PostHog API rate limited (429) after ${MAX_RETRY_ATTEMPTS} attempts. Retry-After: ${response.headers.get("retry-after") || "unknown"}`
        )
      } else {
        console.error(
          `PostHog API error: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`
        )
      }
      return null
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error("PostHog query failed:", error instanceof Error ? error.message : error)
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

       // Query for views and time spent
       const topClicksQuery = `
        WITH garment_clicks AS (
          SELECT 
              properties.garment_slug AS garment_slug,
              count() AS clicks
          FROM events
        WHERE 
            event = 'garment_selected'
            AND timestamp >= now() - INTERVAL 90 DAY
            AND timestamp < now()
            AND properties.garment_slug IS NOT NULL
        GROUP BY properties.garment_slug
        ),
        max_clicks AS (
            SELECT max(clicks) AS top_clicks
            FROM garment_clicks
        )
        SELECT 
            garment_slug AS 'Garment Slug',
            clicks AS 'Total Clicks',
            round((clicks / top_clicks) * 100, 1) AS 'Percent of Top'
          FROM garment_clicks
        CROSS JOIN max_clicks
        ORDER BY clicks DESC
        LIMIT 25
        `
    
 
     interface topClicksQueryResultType {
       results?: Array<[string, number | null, number | null]>
     }

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
    const [
      // metricsResult,
      countriesResult,
      // actionsResult,
      topClicksResult
    ] = await Promise.all([
      // executeHogQLQuery<MetricsResult>(metricsQuery),
      executeHogQLQuery<CountriesResult>(countriesQuery),
      // executeHogQLQuery<ActionsResult>(actionsQuery),
      executeHogQLQuery<topClicksQueryResultType>(topClicksQuery),
    ])

    // Parse metrics
    const topClicksPercentage = topClicksResult?.results?.find(([slug]) => slug === garmentSlug)?.[2] ?? 0
    // const [viewCount, totalTime, avgTime] = metricsResult?.results?.[0] ?? [0, 0, 0]

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

    // // Parse action breakdown
    // const actionBreakdown: ActionBreakdown = {
    //   description: 0,
    //   tiktok: 0,
    //   provenance: 0,
    //   construction: 0,
    //   analytics: 0,
    //   export: 0,
    // }

    // for (const row of actionsResult?.results ?? []) {
    //   const [actionType, count] = row
    //   if (actionType && count && actionType in actionBreakdown) {
    //     actionBreakdown[actionType as keyof ActionBreakdown] = count
    //   }
    // }

    return {
      // totalViews: viewCount ?? 0,
      // totalTimeSpent: totalTime ?? 0,
      // avgTimePerView: avgTime ?? 0,
      topCountries:  topCountries.map((country) => ({
        country: country.country,
        countryCode: country.countryCode,
      })),
      // actionBreakdown,
      topClicksPercentage
    }
  },
  ["garment-metrics"],
  {
    revalidate: CACHE_REVALIDATION_SECONDS,
    tags: ["analytics"],
  }
)


/**
 * Get analytics for a specific garment (cached)
 */
export const getGarmentTopClicksCached = unstable_cache(
  async () => {
    // Query for views and time spent
    const query = `
      WITH garment_clicks AS (
    SELECT 
        properties.garment_slug AS garment_slug,
        count() AS clicks
    FROM events
    WHERE 
        event = 'garment_selected'
        AND timestamp >= now() - INTERVAL 90 DAY
        AND timestamp < now()
        AND properties.garment_slug IS NOT NULL
    GROUP BY properties.garment_slug
),
max_clicks AS (
    SELECT max(clicks) AS top_clicks
    FROM garment_clicks
)
SELECT 
    garment_slug AS 'Garment Slug',
    clicks AS 'Total Clicks',
    round((clicks / top_clicks) * 100, 1) AS 'Percent of Top'
  FROM garment_clicks
CROSS JOIN max_clicks
ORDER BY clicks DESC
LIMIT 25
    `



    interface queryResultType {
      results?: Array<[string | null, number | null, number | null]>
    }

    // Execute all queries in parallel
    const [result] = await Promise.all([
      executeHogQLQuery<queryResultType>(query),
    ])

    // Parse metrics
    const results = result?.results ?? []

    const initialValue: Record<string, number> = {}
    const topClicksPercentages = results.reduce((acc, curr): Record<string, number> => {
      acc[curr[0] as string] = curr[2] ?? 0
      return acc
    }, initialValue)

    return {
      topClicksPercentages,
    }
  },
  ["garment-top-clicks"],
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
  const garmentMetrics = await getGarmentMetricsCached(garmentSlug)

  // // Calculate normalized interest score
  // // Weight: 40% views, 60% time spent (time indicates deeper engagement)
  // const normalizedViews = garmentMetrics.totalViews / globalMetrics.maxViews
  // const normalizedTime = garmentMetrics.totalTimeSpent / globalMetrics.maxTimeSpent
  // const interestScore = normalizedViews * 0.4 + normalizedTime * 0.6

  // // Clamp to 0-1 range
  // const clampedScore = Math.max(0, Math.min(1, interestScore))

  // // Calculate interest level
  // const interestLevel = calculateInterestLevel(clampedScore)
//   const interestColor = INTEREST_COLORS[interestLevel]

  return {
    interestScore: garmentMetrics.topClicksPercentage,
    interestLevel: calculateInterestLevel(garmentMetrics.topClicksPercentage / 100),
  //   interestColor,
  //   totalViews: garmentMetrics.totalViews,
  //   totalTimeSpent: Math.round(garmentMetrics.totalTimeSpent),
  //   avgTimePerView: Math.round(garmentMetrics.avgTimePerView),
    topCountries: garmentMetrics.topCountries,
  //   actionBreakdown: garmentMetrics.actionBreakdown,
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
