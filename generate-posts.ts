import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-09',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface NewsSource {
  name: string;
}

interface NewsArticle {
  title: string;
  description: string;
  source: NewsSource;
}

async function fetchAndCreateFinancialPost(): Promise<void> {
  try {
    const apiKey = process.env.NEWS_API_KEY; 
    const url = `https://newsapi.org/v2/everything?q=US+stock+market+economy&sortBy=publishedAt&pageSize=1&apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      console.log('No se encontraron nuevos artículos.');
      return;
    }

    const article: NewsArticle = data.articles[0];

    const existing = await client.fetch<{ _id: string } | null>(
      `*[_type == "post" && title == $title][0] { _id }`,
      { title: article.title }
    );

    if (existing) {
      console.log(`Ya existe el post "${article.title}", se omite.`);
      return;
    }

    // 1. Extraemos la fuente original de la API (ej: "Reuters", "Bloomberg", etc.)
    const sourceName = article.source?.name || 'External Source';
    
    // 2. Combinamos la fuente dinámica con tu firma fija hardcodeada
    const footerText = `Source: ${sourceName} / MarketPulse US Reporting`;

    const postData = {
      _type: 'post',
      title: article.title,
      slug: {
        _type: 'slug',
        current: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 96) + '-' + Date.now(),
      },
      publishedAt: new Date().toISOString(),
      body: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: article.description || 'No description available.',
            },
          ],
        },
        // 3. Agregamos el bloque final con la fuente combinada de forma automática
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: footerText,
              marks: ['em'], // Opcional: Esto le da el formato en cursiva (italic)
            },
          ],
        },
      ],
    };

    const result = await client.create(postData);
    console.log(`[TypeScript] Noticia real consumida e inyectada con éxito. ID: ${result._id}`);
  } catch (error: unknown) {
    console.error('Error al consumir la API de noticias:', (error as Error).message);
  }
}

fetchAndCreateFinancialPost();