import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, GitBranch, Circle, Search, X } from "lucide-react";
import { githubClient, type GitHubIssue, type ApiError } from "@/lib/github-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

type LoadingState = "loading" | "success" | "error";
type IssueState = "open" | "closed" | "all";

const PER_PAGE = 30;

export function IssuesList() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [state, setState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [issueState, setIssueState] = useState<IssueState>("open");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function loadIssues() {
      if (!owner || !repo) {
        setState("error");
        setError("Invalid repository path");
        return;
      }

      setState("loading");
      setError(null);
      setCurrentPage(1);
      setHasMore(false);

      try {
        let issuesData: GitHubIssue[];
        let totalCount = 0;

        if (debouncedSearchQuery.trim()) {
          // Use search API
          const searchResults = await githubClient.searchIssues(
            owner,
            repo,
            debouncedSearchQuery,
            issueState,
            1,
            PER_PAGE,
          );
          issuesData = searchResults.items;
          totalCount = searchResults.total_count;
        } else {
          // Use regular API
          issuesData = await githubClient.getIssues(owner, repo, issueState, 1, PER_PAGE);
          totalCount = issuesData.length;
        }

        // Filter out pull requests (they have pull_request property)
        const issuesOnly = issuesData.filter((issue) => !issue.pull_request);
        setIssues(issuesOnly);
        setHasMore(
          debouncedSearchQuery.trim()
            ? issuesOnly.length < totalCount
            : issuesData.length === PER_PAGE,
        );
        setState("success");
      } catch (err) {
        setState("error");
        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setError(`Repository ${owner}/${repo} not found.`);
        } else if (apiError.status === 403) {
          setError("Rate limit exceeded. Please try again later or sign in.");
        } else {
          setError(apiError.message || "Failed to load issues");
        }
      }
    }

    loadIssues();
  }, [owner, repo, issueState, debouncedSearchQuery]);

  const loadMoreIssues = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      let issuesData: GitHubIssue[];
      let totalCount = 0;

      if (debouncedSearchQuery.trim()) {
        // Use search API
        const searchResults = await githubClient.searchIssues(
          owner!,
          repo!,
          debouncedSearchQuery,
          issueState,
          nextPage,
          PER_PAGE,
        );
        issuesData = searchResults.items;
        totalCount = searchResults.total_count;
      } else {
        // Use regular API
        issuesData = await githubClient.getIssues(owner!, repo!, issueState, nextPage, PER_PAGE);
        totalCount = issuesData.length;
      }

      // Filter out pull requests (they have pull_request property)
      const issuesOnly = issuesData.filter((issue) => !issue.pull_request);
      setIssues((prev) => [...prev, ...issuesOnly]);
      setCurrentPage(nextPage);
      setHasMore(
        debouncedSearchQuery.trim()
          ? issues.length + issuesOnly.length < totalCount
          : issuesData.length === PER_PAGE,
      );
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to load more issues");
    } finally {
      setLoadingMore(false);
    }
  };

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
  }, []);

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border pb-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex gap-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* State Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={issueState === "open" ? "default" : "ghost"}
          size="sm"
          onClick={() => setIssueState("open")}
          className="text-sm"
        >
          Open
        </Button>
        <Button
          variant={issueState === "closed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setIssueState("closed")}
          className="text-sm"
        >
          Closed
        </Button>
        <Button
          variant={issueState === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setIssueState("all")}
          className="text-sm"
        >
          All
        </Button>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Circle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No {issueState === "all" ? "" : issueState} issues found.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {issues.map((issue) => (
              <Card key={issue.id} className="hover:bg-accent/50 transition-colors">
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-1">
                        {issue.state === "open" ? (
                          <Circle className="h-5 w-5 text-green-500 fill-current" />
                        ) : (
                          <Circle className="h-5 w-5 text-purple-500 fill-current" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1">
                            {issue.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {issue.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {issue.labels.slice(0, 3).map((label) => (
                                  <span
                                    key={label.id}
                                    className="px-2 py-0.5 text-xs rounded-full border"
                                    style={{
                                      backgroundColor: `#${label.color}20`,
                                      borderColor: `#${label.color}40`,
                                      color: `#${label.color}`,
                                    }}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                                {issue.labels.length > 3 && (
                                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                    +{issue.labels.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="whitespace-nowrap">#{issue.number}</span>
                          {issue.user && (
                            <span className="whitespace-nowrap">by {issue.user.login}</span>
                          )}
                          <span className="whitespace-nowrap">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                          {issue.comments > 0 && (
                            <span className="whitespace-nowrap flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {issue.comments}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </a>
              </Card>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMoreIssues} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
