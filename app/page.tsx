import { createClient } from '@sanity/client';
import Link from 'next/link';
import { getMarketData } from '@/app/api/market/market';
import MarketTicker from '@/app/components/MarketTicker';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-09',
  useCdn: true,
});

interface PostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
}

export default async function Home() {
  const [posts, marketIndices] = await Promise.all([
    client.fetch<PostSummary[]>(`*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt
    }`),
    getMarketData()
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <MarketTicker marketIndices={marketIndices} />

      <div className="max-w-4xl mx-auto p-8">
        <header className="mb-12 border-b border-neutral-800 pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">MarketPulse US</h1>
          <p className="text-sm text-neutral-400">Financial insights, market data, and economic analysis.</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-wide text-neutral-200">Latest Articles</h2>
          
          {posts.length === 0 ? (
            <p className="text-neutral-500">No hay artículos publicados todavía.</p>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <article key={post._id} className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition">
                  <Link href={`/${post.slug.current}`} className="group">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition mb-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Publicado el {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}