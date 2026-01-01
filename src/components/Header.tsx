import { useState } from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { UserMenu } from "./UserMenu";
import { TokenLogin } from "./TokenLogin";

export function Header() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Github className="h-6 w-6" />
            <span>Da Forge</span>
          </Link>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button onClick={() => setShowLogin(true)} className="gap-2">
                <Github className="h-4 w-4" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLogin && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-background border border-border hover:bg-muted"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <TokenLogin />
          </div>
        </div>
      )}
    </>
  );
}
