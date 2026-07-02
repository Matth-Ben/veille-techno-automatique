"use client";

import { useState } from "react";
import type { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
}

function getScoreStyles(score: number): { gradient: string; ring: string } {
  if (score >= 9)
    return {
      gradient: "from-emerald-500 to-green-500",
      ring: "ring-emerald-500/20",
    };
  if (score >= 8)
    return {
      gradient: "from-teal-500 to-emerald-500",
      ring: "ring-teal-500/20",
    };
  if (score >= 7)
    return {
      gradient: "from-amber-500 to-orange-500",
      ring: "ring-amber-500/20",
    };
  return { gradient: "from-red-500 to-rose-500", ring: "ring-red-500/20" };
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const scoreStyles = getScoreStyles(article.score);
  const showImage = Boolean(article.image) && !imageFailed;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/60 transition-shadow hover:shadow-md hover:shadow-slate-200 sm:flex-row">
      {/* Toute la carte est cliquable via ce lien étiré */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ouvrir l'article : ${article.title}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500"
      />

      <div className="aspect-video w-full shrink-0 overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-100 sm:aspect-auto sm:w-36">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image ?? undefined}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-8 w-8 text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 2a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${scoreStyles.gradient} text-xl font-bold text-white shadow-sm ring-4 ${scoreStyles.ring}`}
          >
            {article.score}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug text-slate-900 line-clamp-2">
              {article.title}
            </h2>

            {/* Source et date discrets */}
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate font-medium text-slate-500">
                {article.source}
              </span>
              <span aria-hidden="true">•</span>
              <span>{formatDate(article.date)}</span>
            </div>
          </div>

          {/* Indicateur visuel de lien, la carte entière est cliquable */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-inset ring-indigo-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Avis de Claude, toujours visible, sous les tags */}
        <div className="mt-3 rounded-lg bg-indigo-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-400">
            Avis de Claude
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {article.reason}
          </p>
        </div>
      </div>
    </article>
  );
}
