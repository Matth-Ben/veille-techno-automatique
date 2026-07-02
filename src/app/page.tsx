import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/types";
import Link from "next/link";

const GITHUB_OWNER = process.env.GITHUB_OWNER || "Matth-Ben";
const GITHUB_REPO = process.env.GITHUB_REPO || "veille-techno-automatique";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "master";

async function getArticles(): Promise<Article[]> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/public/data.json`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Failed to fetch data.json:", response.status);
      return [];
    }

    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16M5 19a1 1 0 100-2 1 1 0 000 2z"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900">
                Veille Tech
              </h1>
              {articles.length > 0 && (
                <p className="text-xs leading-tight text-slate-400">
                  {articles.length} article{articles.length > 1 ? "s" : ""}{" "}
                  sélectionné{articles.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/admin"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            aria-label="Administration"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Articles */}
      <div className="mx-auto max-w-3xl px-4 py-5">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16M5 19a1 1 0 100-2 1 1 0 000 2z"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-medium text-slate-600">
              Aucun article pour le moment.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              La veille automatique ajoutera des articles bientôt.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
