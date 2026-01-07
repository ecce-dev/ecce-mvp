"use server"

import { GetGarmentsQuery, GetGarments } from "@/lib/gql/__generated__/graphql";
import { graphQLQuery } from "@/lib/utils/graphql-query";
import { unstable_cache } from "next/cache";

/** Fields to filter out from garmentFields when not in research mode */
const privateFields = [
  'patternPng',
  'patternDescription',
] as const;

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
  const isLoggedInResearchMode = true;
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
 * @returns Array of randomly selected garment nodes
 * 
 * Security: Uses cryptographically secure randomization
 * Performance: Leverages cached garment list, only shuffles on each call
 */
export async function getRandomGarments(count: number): Promise<GarmentNode[]> {
  // Clamp count to valid range for safety
  const safeCount = Math.max(1, Math.min(10, Math.floor(count)));
  
  const isLoggedInResearchMode = true;
  const allGarments = await fetchAllGarmentsCached();
  
  if (allGarments.length === 0) {
    return [];
  }

  // Filter private fields first
  const filteredGarments = filterPrivateFields(allGarments, isLoggedInResearchMode);
  
  // If we have fewer garments than requested, return all of them shuffled
  if (filteredGarments.length <= safeCount) {
    return secureShuffleArray(filteredGarments);
  }

  // Shuffle and take the requested count
  const shuffled = secureShuffleArray(filteredGarments);
  return shuffled.slice(0, safeCount);
}

/**
 * Get the total count of available garments
 * Useful for UI elements that need to know if more garments exist
 */
export async function getGarmentsCount(): Promise<number> {
  const allGarments = await fetchAllGarmentsCached();
  return allGarments.length;
}
