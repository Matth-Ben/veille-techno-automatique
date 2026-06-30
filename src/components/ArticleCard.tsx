"use client";

import { useState } from "react";
import type { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
}

function getScoreColor(score: number): string {
  if (score >= 9) return "bg-green-500";
  if (score >= 8) return "bg-emerald-500";
  if (score >= 7) return "bg-amber-500";
  return "bg-red-500";
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        {/* Header avec score */}
        <div className="flex items-start gap-3">
          <div
            className={`${getScoreColor(article.score)} text-white font-bold text-xl w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}
          >
            {article.score}
          </div>

          <div className="flex-1 min-w-0">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 active:text-blue-600">
                {article.title}
              </h2>
            </a>

            {/* Source et date discrets */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
              <span className="truncate">{article.source}</span>
              <span>•</span>
              <span>{formatDate(article.date)}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {article.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bouton accordéon */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full min-h-[44px] flex items-center justify-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg active:bg-blue-100 transition-colors"
        >
          <span>{isExpanded ? "Masquer" : "Lire l'avis de Claude"}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Contenu accordéon */}
        {isExpanded && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {article.reason}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
