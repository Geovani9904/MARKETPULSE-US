import { createClient } from '@sanity/client'

interface NewsSource {
  name: string;
}

interface NewsArticle {
  title: string;
  description: string;
  source: NewsSource;
}

export interface GenerateResult {
  status: 'created' | 'duplicate' | 'empty';
  postId?: string;
  title?: string;
  message: string;
}

/**
 * Lógica compartida: consume newsapi.org, detecta duplicados y crea el post en Sanity.
 * Usada por:
 *  - app/api/generate-posts/route.ts (cron de Vercel)
 *  - generate-posts.ts (CLI local / GitHub Actions como backup)
 */
export async function generateFinancialPost(): Promise<GenerateResult> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing environment variable: NEWS_API_KEY');
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-09',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
  });

  const url = `https://newsapi.org/v2/everything?q=US+stock+market+economy&sortBy=publishedAt&pageSize=1&apiKey=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    throw new Error(`NewsAPI respondió con estado ${response.status}`);
  }
  const data = await response.json();

  if (!data.articles || data.articles.length === 0) {
    return { status: 'empty', message: 'No se encontraron artículos.' };
  }

  const article: NewsArticle = data.articles[0];

  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "post" && title == $title][0] { _id }`,
    { title: article.title }
  );

  if (existing) {
    return {
      status: 'duplicate',
      title: article.title,
      message: 'El post ya existe, se omite.',
    };
  }

  // 1. Extraemos la fuente original de la API (ej: "Reuters", "Bloomberg", etc.)
  const sourceName = article.source?.name || 'External Source';

  // 2. Combinamos la fuente dinámica con la firma fija
  const footerText = `Source: ${sourceName} / MarketPulse US Reporting`;

  const postData = {
    _type: 'post',
    title: article.title,
    slug: {
      _type: 'slug',
      current:
        article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 96) +
        '-' +
        Date.now(),
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
  return {
    status: 'created',
    postId: result._id,
    message: 'Post creado.',
  };
}