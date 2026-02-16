"use server"

import { GetGarmentsQuery, GetGarments } from "@/lib/gql/__generated__/graphql";
import { graphQLQuery } from "@/lib/utils/graphql-query";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

/** Fields to filter out from garmentFields when not in research mode */
const privateFields = [
  'patternPng',
  'patternDescription',
  'patternZipDownload',
  'provenance',
  'construction'
] as const;

/** Session cookie name (must match auth routes) */
const SESSION_COOKIE_NAME = "ecce_session";

/** Cache revalidation interval in seconds (5 minutes) */
const CACHE_REVALIDATION_SECONDS = 300;

/** Type for a single garment node */
export type GarmentNode = NonNullable<NonNullable<GetGarmentsQuery['garments']>['nodes'][number]>;

/**
 * Cryptographically secure Fisher-Yates shuffle algorithm
 * Uses crypto.getRandomValues for secure randomization
 */
function secureShuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  const randomValues = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomValues);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use the pre-generated random value, bounded to valid range
    const j = randomValues[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Filter private fields from garment data when not in research mode
 */
function filterPrivateFields(nodes: GarmentNode[], isResearchMode: boolean): GarmentNode[] {
  if (isResearchMode) {
    return nodes;
  }

  const privateFieldsSet = new Set<string>(privateFields);
  
  return nodes.map((node) => {
    if (!node?.garmentFields) return node;

    const publicGarmentFields = Object.fromEntries(
      Object.entries(node.garmentFields).filter(([key]) => !privateFieldsSet.has(key))
    );

    return {
      ...node,
      garmentFields: publicGarmentFields,
    };
  }) as GarmentNode[];
}

/**
 * Check if the current user has a valid session (research mode)
 * Reads the ecce_session cookie and validates expiry
 */
async function isResearchMode(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return false;
    }

    const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const sessionData = JSON.parse(decoded);

    return sessionData.expiresAt > Date.now();
  } catch {
    return false;
  }
}

/**
 * Fetches all garments from CMS with caching
 * Cache is revalidated every 5 minutes
 */
const fetchAllGarmentsCached = unstable_cache(
  async (): Promise<GarmentNode[]> => {
    const result = await graphQLQuery<GetGarmentsQuery, null>(
      GetGarments,
      null,
      'getGarments',
    );

    if (!result?.garments?.nodes) {
      return [];
    }

    // Filter out null/undefined nodes
    return result.garments.nodes.filter((node): node is GarmentNode => node !== null);
  },
  ['garments-list'],
  {
    revalidate: CACHE_REVALIDATION_SECONDS,
    tags: ['garments'],
  }
);

/**
 * Get all garments (with optional private field filtering)
 * @deprecated Use getRandomGarments for display purposes
 */
export async function getGarments(): Promise<GetGarmentsQuery | null> {
  const isLoggedInResearchMode = await isResearchMode();
  const nodes = await fetchAllGarmentsCached();
  
  if (nodes.length === 0) {
    return null;
  }

  const filteredNodes = filterPrivateFields(nodes, isLoggedInResearchMode);

  return {
    garments: {
      nodes: filteredNodes,
    },
  } as GetGarmentsQuery;
}

/**
 * Get random garments for display
 * 
 * @param count - Number of garments to return (1-10, clamped for safety)
 * @param excludeSlugs - Optional array of garment slugs to exclude from selection
 * @returns Array of randomly selected garment nodes
 * 
 * Security: Uses cryptographically secure randomization
 * Performance: Leverages cached garment list, only shuffles on each call
 * 
 * Exclusion logic:
 * - First tries to select only from non-excluded garments
 * - If not enough non-excluded garments available, fills remaining slots
 *   with shuffled excluded garments to reach the requested count
 */
export async function getRandomGarments(
  count: number,
  excludeSlugs: string[] = []
): Promise<GarmentNode[]> {
  // Clamp count to valid range for safety
  const safeCount = Math.max(1, Math.min(10, Math.floor(count)));
  
  const isLoggedInResearchMode = await isResearchMode();
  const allGarments = await fetchAllGarmentsCached();
  
  if (allGarments.length === 0) {
    return [];
  }

  // Filter private fields first
  const filteredGarments = filterPrivateFields(allGarments, isLoggedInResearchMode);

  // Exclude garments marked as excluded on homepage
  const homepageGarments = filteredGarments.filter(
    (garment) => !garment.garmentFields?.excludeOnHomepage
  );

  // If we have fewer garments than requested, return all of them shuffled
  if (homepageGarments.length <= safeCount) {
    return secureShuffleArray(homepageGarments);
  }

  // Create set for O(1) lookup of excluded slugs
  const excludeSet = new Set(excludeSlugs);

  // Separate garments into available (not excluded) and excluded
  const availableGarments: GarmentNode[] = [];
  const excludedGarments: GarmentNode[] = [];

  for (const garment of homepageGarments) {
    if (garment.slug && excludeSet.has(garment.slug)) {
      excludedGarments.push(garment);
    } else {
      availableGarments.push(garment);
    }
  }

  // Shuffle both arrays
  const shuffledAvailable = secureShuffleArray(availableGarments);
  const shuffledExcluded = secureShuffleArray(excludedGarments);

  // Take as many as possible from available garments
  const result: GarmentNode[] = shuffledAvailable.slice(0, safeCount);

  // If we don't have enough, fill from excluded garments
  if (result.length < safeCount) {
    const remaining = safeCount - result.length;
    result.push(...shuffledExcluded.slice(0, remaining));
  }

  return result;
}

/**
 * Get a single garment by slug (bypasses excludeOnHomepage filter)
 * Used when a garment is directly linked via URL
 */
export async function getGarmentBySlug(slug: string): Promise<GarmentNode | null> {
  const isLoggedInResearchMode = await isResearchMode();
  const allGarments = await fetchAllGarmentsCached();
  const garment = allGarments.find((g) => g.slug === slug);

  if (!garment) {
    return null;
  }

  const [filtered] = filterPrivateFields([garment], isLoggedInResearchMode);
  return filtered ?? null;
}

/**
 * Re-fetch garments by their slugs (e.g. after login to get private fields)
 */
export async function getGarmentsBySlugs(slugs: string[]): Promise<GarmentNode[]> {
  const isLoggedInResearchMode = await isResearchMode();
  const allGarments = await fetchAllGarmentsCached();

  // Build lookup map for O(1) access
  const garmentMap = new Map(allGarments.map((g) => [g.slug, g]));

  // Preserve input order so carousel positions don't shift
  const matched = slugs
    .map((slug) => garmentMap.get(slug))
    .filter((g): g is GarmentNode => g !== undefined);

  return filterPrivateFields(matched, isLoggedInResearchMode);
}

/**
 * Get the total count of available garments
 * Useful for UI elements that need to know if more garments exist
 */
export async function getGarmentsCount(): Promise<number> {
  const allGarments = await fetchAllGarmentsCached();
  return allGarments.filter(
    (garment) => !garment.garmentFields?.excludeOnHomepage
  ).length;
}
