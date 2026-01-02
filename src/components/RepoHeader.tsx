import {
  GitFork,
  Star,
  Eye,
  Book,
  Scale,
  ExternalLink,
  GitPullRequest,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { type GitHubRepository } from "@/lib/github-api";

interface RepoHeaderProps {
  repo: GitHubRepository;
}

export function RepoHeader({ repo }: RepoHeaderProps) {
  const location = useLocation();
  const basePath = `/r/${repo.owner.login}/${repo.name}`;

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname.includes("/issues")) return "issues";
    if (location.pathname.includes("/pulls")) return "pulls";
    return "readme";
  };

  const activeTab = getActiveTab();

  return (
    <div className="border-b border-border pb-6 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Book className="h-5 w-5 text-muted-foreground shrink-0" />
            <h1 className="text-2xl font-semibold truncate">
              <a href={`/r/${repo.owner.login}`} className="text-blue-600 hover:underline">
                {repo.owner.login}
              </a>
              <span className="text-muted-foreground mx-1">/</span>
              <span>{repo.name}</span>
            </h1>
            {repo.private && (
              <span className="px-2 py-0.5 text-xs border border-border rounded-full text-muted-foreground">
                Private
              </span>
            )}
            {repo.fork && (
              <span className="px-2 py-0.5 text-xs border border-border rounded-full text-muted-foreground">
                Fork
              </span>
            )}
          </div>
          {repo.description && <p className="text-muted-foreground mb-4">{repo.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                {repo.homepage}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={`${repo.html_url}/stargazers`} target="_blank" rel="noopener noreferrer">
              <Star className="h-4 w-4" />
              <span>Star</span>
              <span className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">
                {repo.stargazers_count.toLocaleString()}
              </span>
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={`${repo.html_url}/fork`} target="_blank" rel="noopener noreferrer">
              <GitFork className="h-4 w-4" />
              <span>Fork</span>
              <span className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">
                {repo.forks_count.toLocaleString()}
              </span>
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          <span>{repo.stargazers_count.toLocaleString()} stars</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{repo.watchers_count.toLocaleString()} watching</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="h-4 w-4" />
          <span>{repo.forks_count.toLocaleString()} forks</span>
        </div>
        {repo.license && (
          <div className="flex items-center gap-1">
            <Scale className="h-4 w-4" />
            <span>{repo.license.name}</span>
          </div>
        )}
        {repo.language && (
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getLanguageColor(repo.language) }}
            />
            <span>{repo.language}</span>
          </div>
        )}
      </div>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {repo.topics.map((topic) => (
            <span
              key={topic}
              className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1 mt-6 border-b border-border -mb-6 overflow-x-auto">
        <Link
          to={basePath}
          className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "readme"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          README
        </Link>
        <Link
          to={`${basePath}/issues`}
          className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "issues"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <Circle className="h-4 w-4 shrink-0" />
          <span>Issues</span>
          {repo.open_issues_count > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-muted rounded-full shrink-0">
              {repo.open_issues_count}
            </span>
          )}
        </Link>
        <Link
          to={`${basePath}/pulls`}
          className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "pulls"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <GitPullRequest className="h-4 w-4 shrink-0" />
          <span>Pull Requests</span>
        </Link>
      </div>
    </div>
  );
}

// Common language colors (subset of GitHub's language colors)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Vue: "#41b883",
    Svelte: "#ff3e00",
  };
  return colors[language] || "#8b949e";
}
