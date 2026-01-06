import type { CodegenConfig } from '@graphql-codegen/cli';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createBasicAuthHeader } from './lib/actions/apolloClient';

// Load environment variables from .env files (same priority as Next.js)
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const schemaUrl = process.env.WORDPRESS_CMS_URL + '/graphql';
const authHeader = createBasicAuthHeader();

// Validate required environment variables during build
if (!process.env.WORDPRESS_CMS_URL) {
  console.warn('Warning: WORDPRESS_CMS_URL is not set. Codegen may fail.');
}

if (!authHeader) {
  console.warn('Warning: WORDPRESS_CMS_BASIC_AUTH_USER or WORDPRESS_CMS_BASIC_AUTH_PW is not set. GraphQL schema fetch may fail.');
}

const config: CodegenConfig = {
  schema: {
    [schemaUrl]: {
      headers: authHeader ? {
        'Authorization': authHeader,
      } : {},
    },
  },
  documents: ['lib/gql/**/*.gql', 'lib/gql/**/*.graphql'],
  generates: {
    'lib/gql/__generated__/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-document-nodes',
      ],
      config: {
        // Generate TypeScript types
        skipTypename: false,
        // Use enums instead of unions for better type safety
        enumsAsTypes: true,
        // Generate DocumentNode exports for Apollo Client
        dedupeFragments: true,
        // Prefer interfaces over types for better extensibility
        useTypeImports: true,
      },
    },
  },
  // Ignore node_modules and generated files
  ignoreNoDocuments: true,
};

export default config;
