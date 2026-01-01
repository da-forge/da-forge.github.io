import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { githubClient, type GitHubRepository, type ApiError } from "@/lib/github-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RepoHeader } from "./RepoHeader";
import { ReadmeViewer } from "./ReadmeViewer";

type LoadingState = "loading" | "success" | "error";

export function RepositoryView() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [readme, setReadme] = useState<string>("");
  const [state, setState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepository() {
      if (!owner || !repo) {
        setState("error");
        setError("Invalid repository path");
        return;
      }

      setState("loading");
      setError(null);

      try {
        // Fetch repository and README in parallel
        const [repoData, readmeContent] = await Promise.all([
          githubClient.getRepository(owner, repo),
          githubClient.getReadmeContent(owner, repo).catch(() => ""),
        ]);

        setRepository(repoData);
        setReadme(readmeContent);
        setState("success");
      } catch (err) {
        setState("error");
        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setError(`Repository ${owner}/${repo} not found. It may be private or doesn't exist.`);
        } else if (apiError.status === 403) {
          setError("Rate limit exceeded. Please try again later or sign in.");
        } else {
          setError(apiError.message || "Failed to load repository");
        }
      }
    }

    loadRepository();
  }, [owner, repo]);

  if (state === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Loading {owner}/{repo}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error" || !repository) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RepoHeader repo={repository} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">README.md</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadmeViewer content={readme} />
        </CardContent>
      </Card>
    </div>
  );
}
