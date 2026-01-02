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

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  locked: boolean;
  user: GitHubUser;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: {
    id: number;
    number: number;
    title: string;
    description: string | null;
    state: "open" | "closed";
  } | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
  html_url: string;
  url: string;
}

export interface GitHubPullRequest extends GitHubIssue {
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository | null;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository;
  };
  draft: boolean;
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
   * Get decoded README content with metadata
   */
  async getReadmeWithContent(
    owner: string,
    repo: string,
  ): Promise<{ content: string; name: string } | null> {
    try {
      const readme = await this.getReadme(owner, repo);
      let content = readme.content;
      if (readme.encoding === "base64") {
        // Properly decode base64 with UTF-8 support
        content = decodeURIComponent(
          atob(content)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
      }
      return {
        content,
        name: readme.name,
      };
    } catch (error) {
      // README might not exist
      if ((error as ApiError).status === 404) {
        return null;
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

  // ============ Issues Endpoints ============

  /**
   * Get repository issues
   */
  async getIssues(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    page = 1,
    perPage = 30,
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      state,
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return this.request<GitHubIssue[]>(`/repos/${owner}/${repo}/issues?${params.toString()}`);
  }

  // ============ Pull Requests Endpoints ============

  /**
   * Get repository pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    page = 1,
    perPage = 30,
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams({
      state,
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return this.request<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls?${params.toString()}`);
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

  /**
   * Search issues in a repository
   */
  async searchIssues(
    owner: string,
    repo: string,
    query: string,
    state: "open" | "closed" | "all" = "open",
    page = 1,
    perPage = 30,
  ): Promise<{
    total_count: number;
    incomplete_results: boolean;
    items: GitHubIssue[];
  }> {
    // Build search query: repo:owner/repo type:issue state:open/closed query
    let searchQuery = `repo:${owner}/${repo} type:issue`;
    if (state !== "all") {
      searchQuery += ` state:${state}`;
    }
    if (query.trim()) {
      searchQuery += ` ${query.trim()}`;
    }
    const params = new URLSearchParams({
      q: searchQuery,
      page: page.toString(),
      per_page: perPage.toString(),
    });
    // Don't cache search results as they're dynamic
    return this.request(`/search/issues?${params.toString()}`, {}, false);
  }

  /**
   * Search pull requests in a repository
   */
  async searchPullRequests(
    owner: string,
    repo: string,
    query: string,
    state: "open" | "closed" | "all" = "open",
    page = 1,
    perPage = 30,
  ): Promise<{
    total_count: number;
    incomplete_results: boolean;
    items: GitHubPullRequest[];
  }> {
    // Build search query: repo:owner/repo type:pr state:open/closed query
    let searchQuery = `repo:${owner}/${repo} type:pr`;
    if (state !== "all") {
      searchQuery += ` state:${state}`;
    }
    if (query.trim()) {
      searchQuery += ` ${query.trim()}`;
    }
    const params = new URLSearchParams({
      q: searchQuery,
      page: page.toString(),
      per_page: perPage.toString(),
    });
    // Don't cache search results as they're dynamic
    return this.request(`/search/issues?${params.toString()}`, {}, false);
  }
}

// Export a singleton instance
export const githubClient = new GitHubClient();

// Export class for testing or multiple instances
export { GitHubClient };
