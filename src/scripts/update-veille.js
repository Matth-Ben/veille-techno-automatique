import { createHash } from "crypto";
import Parser from "rss-parser";

// Configuration
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MAX_ARTICLES = 100;
const MIN_SCORE = 7;

// Flux RSS de test
const RSS_FEEDS = [
  { name: "Dev.to", url: "https://dev.to/feed" },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed" },
  { name: "WP Tavern", url: "https://wptavern.com/feed" },
  { name: "CSS-Tricks", url: "https://css-tricks.com/feed" },
];

// Génère un ID unique basé sur l'URL
function generateId(url) {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

// Récupère un fichier depuis GitHub
async function fetchFromGitHub(filePath) {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
  }

  return response.text();
}

// Récupère le SHA d'un fichier sur GitHub
async function getFileSha(filePath) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to get SHA: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

// Met à jour un fichier sur GitHub
async function updateFileOnGitHub(filePath, content, message) {
  const sha = await getFileSha(filePath);
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: GITHUB_BRANCH,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update ${filePath}: ${response.status} - ${error}`);
  }

  console.log(`✓ Updated ${filePath}`);
}

// Appelle Claude pour analyser un article
async function analyzeWithClaude(systemPrompt, title, summary) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyse cet article et renvoie un JSON strict avec les champs "score" (1-10), "reason" (explication courte), et "tags" (array de tags pertinents).

Titre: ${title}

Résumé: ${summary || "Pas de résumé disponible"}

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text || "";

  try {
    // Tente de parser le JSON (peut être encapsulé dans des backticks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Number(parsed.score) || 0,
      reason: String(parsed.reason || ""),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    };
  } catch (e) {
    console.error("Failed to parse Claude response:", text);
    return { score: 0, reason: "Erreur de parsing", tags: [] };
  }
}

// Parse les flux RSS
async function fetchRssFeeds() {
  const parser = new Parser();
  const allItems = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching ${feed.name}...`);
      const parsed = await parser.parseURL(feed.url);

      for (const item of parsed.items.slice(0, 10)) {
        allItems.push({
          title: item.title || "Sans titre",
          url: item.link || "",
          source: feed.name,
          summary: item.contentSnippet || item.content || "",
          date: item.pubDate || item.isoDate || new Date().toISOString(),
        });
      }

      console.log(`  → ${parsed.items.length} articles trouvés`);
    } catch (error) {
      console.error(`  ✗ Error fetching ${feed.name}:`, error.message);
    }
  }

  return allItems;
}

// Script principal
async function main() {
  console.log("🚀 Démarrage de la veille...\n");

  // Vérifie les variables d'environnement
  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN || !ANTHROPIC_API_KEY) {
    console.error("❌ Variables d'environnement manquantes:");
    console.error("  GITHUB_OWNER:", GITHUB_OWNER ? "✓" : "✗");
    console.error("  GITHUB_REPO:", GITHUB_REPO ? "✓" : "✗");
    console.error("  GITHUB_TOKEN:", GITHUB_TOKEN ? "✓" : "✗");
    console.error("  ANTHROPIC_API_KEY:", ANTHROPIC_API_KEY ? "✓" : "✗");
    process.exit(1);
  }

  // Charge le prompt système
  console.log("📄 Chargement du prompt...");
  let systemPrompt = await fetchFromGitHub("public/prompt.md");
  if (!systemPrompt) {
    systemPrompt = `Tu es un assistant qui analyse des articles tech. Tu dois évaluer leur pertinence pour un développeur web fullstack intéressé par JavaScript, TypeScript, React, Next.js, Node.js et les bonnes pratiques de développement.`;
    console.log("  → Utilisation du prompt par défaut");
  } else {
    console.log("  → Prompt personnalisé chargé");
  }

  // Charge les articles existants
  console.log("\n📚 Chargement des articles existants...");
  let existingData = { articles: [] };
  const existingJson = await fetchFromGitHub("public/data.json");
  if (existingJson) {
    try {
      existingData = JSON.parse(existingJson);
      console.log(`  → ${existingData.articles?.length || 0} articles existants`);
    } catch (e) {
      console.log("  → Fichier data.json invalide, réinitialisation");
    }
  } else {
    console.log("  → Aucun fichier data.json existant");
  }

  const existingIds = new Set(
    (existingData.articles || []).map((a) => a.id)
  );

  // Récupère les nouveaux articles
  console.log("\n📡 Récupération des flux RSS...");
  const feedItems = await fetchRssFeeds();
  console.log(`\n📊 ${feedItems.length} articles récupérés au total`);

  // Filtre les doublons
  const newItems = feedItems.filter((item) => {
    const id = generateId(item.url);
    return !existingIds.has(id);
  });

  console.log(`🆕 ${newItems.length} nouveaux articles à analyser\n`);

  if (newItems.length === 0) {
    console.log("✓ Aucun nouvel article à traiter");
    return;
  }

  // Analyse chaque article avec Claude
  const analyzedArticles = [];

  for (const item of newItems) {
    console.log(`Analyse: ${item.title.slice(0, 50)}...`);

    try {
      const analysis = await analyzeWithClaude(
        systemPrompt,
        item.title,
        item.summary
      );

      if (analysis.score >= MIN_SCORE) {
        analyzedArticles.push({
          id: generateId(item.url),
          title: item.title,
          url: item.url,
          source: item.source,
          date: item.date,
          score: analysis.score,
          reason: analysis.reason,
          tags: analysis.tags,
          fetchedAt: new Date().toISOString(),
        });
        console.log(`  → Score ${analysis.score}/10 ✓`);
      } else {
        console.log(`  → Score ${analysis.score}/10 (ignoré)`);
      }

      // Pause pour éviter le rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`  ✗ Erreur:`, error.message);
    }
  }

  // Fusionne et trie les articles
  const allArticles = [...analyzedArticles, ...(existingData.articles || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ARTICLES);

  console.log(`\n📝 ${analyzedArticles.length} nouveaux articles qualifiés`);
  console.log(`📦 Total: ${allArticles.length} articles`);

  // Sauvegarde
  const newData = {
    lastUpdate: new Date().toISOString(),
    articles: allArticles,
  };

  await updateFileOnGitHub(
    "public/data.json",
    JSON.stringify(newData, null, 2),
    `Veille auto: +${analyzedArticles.length} articles`
  );

  console.log("\n✅ Veille terminée avec succès !");
}

main().catch((error) => {
  console.error("\n❌ Erreur fatale:", error);
  process.exit(1);
});
