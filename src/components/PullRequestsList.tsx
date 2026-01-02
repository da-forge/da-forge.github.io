import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, GitMerge, GitPullRequest, Circle } from "lucide-react";
import { githubClient, type GitHubPullRequest, type ApiError } from "@/lib/github-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LoadingState = "loading" | "success" | "error";
type PRState = "open" | "closed" | "all";

export function PullRequestsList() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [state, setState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [prState, setPrState] = useState<PRState>("open");

  useEffect(() => {
    async function loadPullRequests() {
      if (!owner || !repo) {
        setState("error");
        setError("Invalid repository path");
        return;
      }

      setState("loading");
      setError(null);

      try {
        const prsData = await githubClient.getPullRequests(owner, repo, prState);
        setPullRequests(prsData);
        setState("success");
      } catch (err) {
        setState("error");
        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setError(`Repository ${owner}/${repo} not found.`);
        } else if (apiError.status === 403) {
          setError("Rate limit exceeded. Please try again later or sign in.");
        } else {
          setError(apiError.message || "Failed to load pull requests");
        }
      }
    }

    loadPullRequests();
  }, [owner, repo, prState]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading pull requests...</p>
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

  const getPRIcon = (pr: GitHubPullRequest) => {
    if (pr.merged) {
      return <GitMerge className="h-5 w-5 text-purple-500 fill-current" />;
    }
    if (pr.state === "closed") {
      return <Circle className="h-5 w-5 text-red-500 fill-current" />;
    }
    if (pr.draft) {
      return <GitPullRequest className="h-5 w-5 text-muted-foreground" />;
    }
    return <GitPullRequest className="h-5 w-5 text-green-500 fill-current" />;
  };

  const getPRStatus = (pr: GitHubPullRequest) => {
    if (pr.merged) return "merged";
    if (pr.draft) return "draft";
    return pr.state;
  };

  return (
    <div className="space-y-4">
      {/* State Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={prState === "open" ? "default" : "ghost"}
          size="sm"
          onClick={() => setPrState("open")}
          className="text-sm"
        >
          Open
        </Button>
        <Button
          variant={prState === "closed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setPrState("closed")}
          className="text-sm"
        >
          Closed
        </Button>
        <Button
          variant={prState === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setPrState("all")}
          className="text-sm"
        >
          All
        </Button>
      </div>

      {/* Pull Requests List */}
      {pullRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No {prState === "all" ? "" : prState} pull requests found.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pullRequests.map((pr) => (
            <Card key={pr.id} className="hover:bg-accent/50 transition-colors">
              <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="block">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">{getPRIcon(pr)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1">
                          {pr.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {pr.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {pr.labels.slice(0, 3).map((label) => (
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
                              {pr.labels.length > 3 && (
                                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                  +{pr.labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">#{pr.number}</span>
                        {pr.user && <span className="whitespace-nowrap">by {pr.user.login}</span>}
                        <span className="whitespace-nowrap">
                          {new Date(pr.created_at).toLocaleDateString()}
                        </span>
                        {pr.head && pr.base && (
                          <span className="whitespace-nowrap text-xs">
                            {pr.head.ref} → {pr.base.ref}
                          </span>
                        )}
                        {pr.comments > 0 && (
                          <span className="whitespace-nowrap flex items-center gap-1">
                            <GitPullRequest className="h-3 w-3" />
                            {pr.comments}
                          </span>
                        )}
                        {getPRStatus(pr) !== "open" && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-muted capitalize">
                            {getPRStatus(pr)}
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
      )}
    </div>
  );
}
