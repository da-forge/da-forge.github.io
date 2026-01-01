import { useState } from "react";
import { Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginWithToken } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

export function TokenLogin() {
  const { refreshUser } = useAuth();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await loginWithToken(token);

    if (result.success) {
      await refreshUser();
      setToken("");
    } else {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Sign in with GitHub</CardTitle>
        <CardDescription>Enter a Personal Access Token to access your repositories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-medium">
              Personal Access Token
            </label>
            <div className="relative">
              <input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Need a token? Create one on GitHub:</p>
          <Button variant="outline" size="sm" className="w-full gap-2" asChild>
            <a
              href="https://github.com/settings/tokens/new?description=Da%20Forge&scopes=repo,user"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3" />
              Create Personal Access Token
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Select the <code className="bg-muted px-1 rounded">repo</code> and{" "}
            <code className="bg-muted px-1 rounded">user</code> scopes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
