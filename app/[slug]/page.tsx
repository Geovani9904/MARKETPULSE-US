import { createClient } from '@sanity/client';
import Link from 'next/link';
import { Metadata } from 'next';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-09',
  useCdn: true,
});

interface SpanChild {
  _key: string;
  _type: string;
  text: string;
  marks?: string[];
}

interface PortableTextBlock {
  _key: string;
  _type: string;
  children?: SpanChild[];
  style?: string;
}

interface Post {
  title: string;
  publishedAt: string;
  body: PortableTextBlock[];
}

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generación dinámica de metadatos para SEO y compartir en redes
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const query = `*[_type == "post" && slug.current == $slug][0]{ title }`;
  const post = await client.fetch<{ title: string } | null>(query, { slug });

  if (!post) {
    return {
      title: 'Artículo no encontrado | MarketPulse US',
    };
  }

  return {
    title: `${post.title} | MarketPulse US`,
    description: 'Financial insights, market data, and economic analysis.',
    openGraph: {
      title: post.title,
      description: 'Financial insights, market data, and economic analysis.',
      type: 'article',
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const query = `*[_type == "post" && slug.current == $slug][0]{
    title,
    publishedAt,
    body
  }`;

  const post = await client.fetch<Post | null>(query, { slug });

  if (!post) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Artículo no encontrado</h1>
          <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">
            ← Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-neutral-400 hover:text-white mb-6 inline-block">
          ← Volver al MarketPulse US
        </Link>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">{post.title}</h1>
        <p className="text-xs text-neutral-500 mb-8">
          Publicado el {new Date(post.publishedAt).toLocaleDateString()}
        </p>
        <article className="prose prose-invert max-w-none space-y-4 text-neutral-300">
          {post.body?.map((block, blockIndex) => {
            if (block._type !== 'block' || !block.children) {
              return null;
            }

            return (
              <p key={block._key || `block-${blockIndex}`}>
                {block.children.map((child, childIndex) => (
                  <span key={child._key || `child-${childIndex}`}>
                    {child.text}
                  </span>
                ))}
              </p>
            );
          })}
        </article>
      </div>
    </main>
  );
}