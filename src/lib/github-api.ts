import { GITHUB_CONFIG } from "@/config";
import { getAuthToken } from "./auth";
import { cacheApiResponse, getCachedResponse } from "./storage";

// ============ Types ============

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
  visibility: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

export interface GitHubReadme {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface ApiError {
  message: string;
  status: number;
  documentation_url?: string;
}

// ============ API Client ============

class GitHubClient {
  private baseUrl = GITHUB_CONFIG.apiBaseUrl;
  private rateLimitInfo: RateLimitInfo | null = null;

  /**
   * Make an authenticated (if token available) request to GitHub API
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = true,
    cacheTtl = 5 * 60 * 1000,
  ): Promise<T> {
    const cacheKey = `github:${endpoint}`;

    // Check cache first
    if (useCache) {
      const cached = await getCachedResponse<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const token = await getAuthToken();

    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Update rate limit info
    this.updateRateLimitInfo(response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.message || `HTTP ${response.status}`,
        status: response.status,
        documentation_url: errorData.documentation_url,
      };
      throw error;
    }

    const data = await response.json();

    // Cache the response
    if (useCache) {
      await cacheApiResponse(cacheKey, data, cacheTtl);
    }

    return data as T;
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");
    const used = headers.get("x-ratelimit-used");

    if (limit && remaining && reset && used) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        used: parseInt(used, 10),
      };
    }
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  // ============ User Endpoints ============

  /**
   * Get the authenticated user's profile
   */
  async getAuthenticatedUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>("/user", {}, true, 60 * 1000);
  }

  /**
   * Get a user's public profile
   */
  async getUser(username: string): Promise<GitHubUser> {
    return this.request<GitHubUser>(`/users/${username}`);
  }

  // ============ Repository Endpoints ============

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * Get repository README
   */
  async getReadme(owner: string, repo: string): Promise<GitHubReadme> {
    return this.request<GitHubReadme>(`/repos/${owner}/${repo}/readme`);
  }

  /**
   * Get decoded README content
   */
  async getReadmeContent(owner: string, repo: string): Promise<string> {
    try {
      const readme = await this.getReadme(owner, repo);
      if (readme.encoding === "base64") {
        return atob(readme.content);
      }
      return readme.content;
    } catch (error) {
      // README might not exist
      if ((error as ApiError).status === 404) {
        return "";
      }
      throw error;
    }
  }

  /**
   * Get repository languages
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  }

  /**
   * Get repository contributors
   */
  async getContributors(owner: string, repo: string, perPage = 10): Promise<GitHubUser[]> {
    return this.request<GitHubUser[]>(`/repos/${owner}/${repo}/contributors?per_page=${perPage}`);
  }

  // ============ Search Endpoints ============

  /**
   * Search repositories
   */
  async searchRepositories(
    query: string,
    page = 1,
    perPage = 10,
  ): Promise<{
    total_count: number;
    incomplete_results: boolean;
    items: GitHubRepository[];
  }> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return this.request(`/search/repositories?${params.toString()}`);
  }
}

// Export a singleton instance
export const githubClient = new GitHubClient();

// Export class for testing or multiple instances
export { GitHubClient };
