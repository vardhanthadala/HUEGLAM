import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticPage, staticPages } from "@/lib/pages-content";

export const revalidate = 3600;

export function generateStaticParams() {
  return staticPages.map((p) => ({ slug: p.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getStaticPage(slug);
  if (!page) return { title: "Page not found" };
  return { title: page.title };
}

export default async function StaticContentPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getStaticPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-2xl px-gutter py-16">
      <h1 className="text-2xl font-light tracking-tight sm:text-3xl">{page.title}</h1>
      <p className="mt-2 text-[0.6875rem] tracking-[0.08em] uppercase text-ink-faint">
        Last updated {page.updated}
      </p>

      <div
        className="rte mt-10"
        dangerouslySetInnerHTML={{ __html: page.body.join("\n") }}
      />
    </div>
  );
}
