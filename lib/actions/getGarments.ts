"use server"

import { GetGarmentsQuery, GetGarments } from "@/lib/gql/__generated__/graphql";
import { graphQLQuery } from "@/lib/utils/graphql-query";


/** Fields to filter out from garmentFields when not in research mode */
const privateFields = [
  'patternPng',
  'patternDescription',
] as const;


export async function getGarments(): Promise<GetGarmentsQuery | null> {
  const isLoggedInResearchMode = true;

  const result = await graphQLQuery<GetGarmentsQuery, null>(
    GetGarments,
    null,
    'getGarments',
  );

  if (!result?.garments?.nodes) {
    return result;
  }

  // When not in research mode, filter out private fields for security
  if (!isLoggedInResearchMode) {
    const privateFieldsSet = new Set<string>(privateFields);

    const filteredNodes = result.garments.nodes.map((node) => {
      if (!node?.garmentFields) return node;

      // Filter out private fields from garmentFields
      const publicGarmentFields = Object.fromEntries(
        Object.entries(node.garmentFields).filter(([key]) => !privateFieldsSet.has(key))
      );

      return {
        ...node,
        garmentFields: publicGarmentFields,
      };
    });

    return {
      ...result,
      garments: {
        ...result.garments,
        nodes: filteredNodes,
      },
    };
  }

  return result;
}