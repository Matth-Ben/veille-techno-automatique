import { NextResponse } from "next/server";

const GITHUB_OWNER = process.env.GITHUB_OWNER || "Matth-Ben";
const GITHUB_REPO = process.env.GITHUB_REPO || "veille-techno-automatique";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "master";

export async function GET() {
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/public/prompt.md`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ content: "" });
      }
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }

    const content = await response.text();
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt" },
      { status: 500 }
    );
  }
}
