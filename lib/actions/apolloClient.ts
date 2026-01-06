import { HttpLink } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Create Basic Auth header from environment variables
export const createBasicAuthHeader = () => {
  const username = process.env.WORDPRESS_CMS_BASIC_AUTH_USER;
  const password = process.env.WORDPRESS_CMS_BASIC_AUTH_PW;
  
  if (!username || !password) {
    console.warn('WORDPRESS_CMS_BASIC_AUTH_USER or WORDPRESS_CMS_BASIC_AUTH_PW environment variables are not set. GraphQL queries will not include Basic Auth.');
    return '';
  }
  
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
};

const client = new ApolloClient({
  link: new HttpLink({ 
    uri: process.env.WORDPRESS_CMS_URL + '/graphql',
    headers: {
      'Authorization': createBasicAuthHeader(),
    },
  }),
  cache: new InMemoryCache(),
});


export default client;