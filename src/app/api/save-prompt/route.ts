import { NextRequest, NextResponse } from "next/server";

const GITHUB_OWNER = process.env.GITHUB_OWNER || "Matth-Ben";
const GITHUB_REPO = process.env.GITHUB_REPO || "veille-techno-automatique";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "master";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

async function getFileSha(filePath: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to get SHA: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN not configured" },
        { status: 500 }
      );
    }

    const { content } = await request.json();

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    const filePath = "public/prompt.md";
    const sha = await getFileSha(filePath);

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    const body: Record<string, string> = {
      message: "Update prompt.md via admin interface",
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
      const errorText = await response.text();
      console.error("GitHub API error:", errorText);
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving prompt:", error);
    return NextResponse.json(
      { error: "Failed to save prompt" },
      { status: 500 }
    );
  }
}
