import { DocumentNode } from '@apollo/client';
import client from '@/lib/actions/apolloClient';


interface QueryOptions {
  variables?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

/**
 * Shared utility for executing GraphQL queries with consistent error handling and caching
 * 
 * Caching Strategy:
 * - Apollo Client cache-first: Uses cached data if available, falls back to network
 * - Cache-Control headers: 1 hour cache with 24 hour stale-while-revalidate
 * 
 * Error Handling:
 * - GraphQL errors: Logged and thrown with descriptive messages
 * - Network errors: Caught and null returned
 * - Missing data: Warning logged, null returned
 */
export async function executeGraphQLQuery<T>(
  query: DocumentNode,
  options: QueryOptions = {}
): Promise<T | null> {
  const { variables, context } = options;

  try {
    const data = await client.query({
      query,
      variables,
      fetchPolicy: 'cache-first', // Use Apollo cache first, then network
      errorPolicy: 'all', // Return both data and errors
      context: {
        // Add cache control headers for better caching
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        },
        ...context
      }
    });

    // Check for GraphQL errors
    if (data.error) {
      console.error('GraphQL error:', data.error);
      throw new Error(`GraphQL error: ${data.error.message}`);
    }

    return data.data as T;
  } catch (error) {
    console.error('Error executing GraphQL query:', error);
    return null;
  }
}

/**
 * Helper function to safely extract data from GraphQL response
 * Returns null if the expected data path doesn't exist
 */
export function extractGraphQLData<T>(
  data: unknown,
  path: string,
  operationName: string
): T | null {
  if (!data) {
    console.warn(`No data returned for ${operationName}`);
    return null;
  }

  const pathParts = path.split('.');
  let result: unknown = data;
  
  for (const part of pathParts) {
    if (result && typeof result === 'object' && result !== null && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      console.warn(`Data path '${path}' not found for ${operationName}`);
      return null;
    }
  }

  return result as T;
}

/**
 * Type-safe wrapper for single content queries
 * Automatically infers the correct type from the GraphQL query result
 */
type GraphQLQueryReturnType<TQuery, TPath extends keyof TQuery | null> = TPath extends null ? TQuery | null : TQuery[Extract<TPath, keyof TQuery>] | null;

export async function graphQLQuery<TQuery, TPath extends keyof TQuery | null>(
  query: DocumentNode,
  dataPath: TPath,
  operationName: string,
  options: QueryOptions = {}
): Promise<GraphQLQueryReturnType<TQuery, TPath>> {
  const data = await executeGraphQLQuery<TQuery>(query, options);
  
  if (!data) {
    return null as GraphQLQueryReturnType<TQuery, TPath>;
  }

  // If dataPath is null, return the full data
  if (dataPath === null) {
    return data as GraphQLQueryReturnType<TQuery, TPath>;
  }

  return extractGraphQLData<TQuery[Extract<TPath, keyof TQuery>]>(data, dataPath as string, operationName) as GraphQLQueryReturnType<TQuery, TPath>;
}