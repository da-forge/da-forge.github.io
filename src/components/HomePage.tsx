import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Github, ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { TokenLogin } from "./TokenLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [repoInput, setRepoInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoInput.trim();
    if (!trimmed) return;

    // Parse input - could be "owner/repo" or just a repo name
    // Also handle full GitHub URLs
    let path = trimmed;

    // Handle full GitHub URLs
    if (path.includes("github.com")) {
      try {
        const url = new URL(path.startsWith("http") ? path : `https://${path}`);
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
          path = `${parts[0]}/${parts[1]}`;
        }
      } catch {
        // Not a valid URL, continue with original input
      }
    }

    // Remove leading/trailing slashes
    path = path.replace(/^\/+|\/+$/g, "");

    navigate(`/r/${path}`);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Github className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Da Forge</h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            A fast, lightweight alternative frontend for GitHub. Browse repositories without the
            bloat.
          </p>
        </div>

        {/* Auth Card */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        ) : isAuthenticated && user ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome back, {user.name || user.login}!</CardTitle>
              <CardDescription>You're signed in and ready to browse repositories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="owner/repo or GitHub URL..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" className="gap-2">
                  Go
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => navigate("/r/facebook/react")}>
                  facebook/react
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/r/microsoft/vscode")}>
                  microsoft/vscode
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/r/vercel/next.js")}>
                  vercel/next.js
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Sign in with GitHub to access your repositories and get higher API rate limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <TokenLogin />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or browse publicly</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="owner/repo or GitHub URL..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" variant="secondary" className="gap-2">
                  Go
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={() => navigate("/r/facebook/react")}>
                  facebook/react
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/r/microsoft/vscode")}>
                  microsoft/vscode
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/r/vercel/next.js")}>
                  vercel/next.js
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="font-semibold mb-1">Fast</div>
            <p className="text-sm text-muted-foreground">Lightweight UI with smart caching</p>
          </div>
          <div className="p-4">
            <div className="font-semibold mb-1">Private</div>
            <p className="text-sm text-muted-foreground">No tracking, data stays in your browser</p>
          </div>
          <div className="p-4">
            <div className="font-semibold mb-1">Open Source</div>
            <p className="text-sm text-muted-foreground">Built with modern web standards</p>
          </div>
        </div>
      </div>
    </div>
  );
}
