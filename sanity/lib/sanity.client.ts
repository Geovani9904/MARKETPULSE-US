import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: '5hcmrybj',
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: true,
});