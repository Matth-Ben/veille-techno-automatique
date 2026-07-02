export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  image?: string | null;
  score: number;
  reason: string;
  tags: string[];
  fetchedAt: string;
}

export interface ClaudeResponse {
  score: number;
  reason: string;
  tags: string[];
}

export interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
}
