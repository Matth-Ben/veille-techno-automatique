"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadPrompt() {
      try {
        const response = await fetch("/api/get-prompt");
        if (response.ok) {
          const data = await response.json();
          setPrompt(data.content || "");
        }
      } catch (error) {
        console.error("Failed to load prompt:", error);
        setMessage({ type: "error", text: "Erreur de chargement du prompt" });
      } finally {
        setIsLoading(false);
      }
    }

    loadPrompt();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/save-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Prompt sauvegardé !" });
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Erreur de sauvegarde",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link
            href="/"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500"
            aria-label="Retour"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Éditer Prompt</h1>
          <div className="w-[44px]" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Message */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Entrez votre system prompt ici..."
              className="flex-1 w-full p-4 border border-gray-300 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
              style={{ minHeight: "300px" }}
            />

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 w-full min-h-[52px] bg-blue-600 text-white font-semibold rounded-xl active:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>

            <p className="mt-3 text-xs text-gray-500 text-center">
              Ce prompt sera utilisé comme instructions système pour Claude lors
              de l'analyse des articles.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
