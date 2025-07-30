// lib/sanity.js
import { createClient } from '@sanity/client';

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: '2025-07-30',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

export default client;
