"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  updated_at: string;
  html_url: string;
  fork: boolean;
  archived: boolean;
  topics: string[];
}

interface UserProfile {
  username: string;
  avatar_url: string;
  github_id: number;
}

interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  PHP: "#4F5D95", CSS: "#563d7c", HTML: "#e34c26", Shell: "#89e051",
  C: "#555555", "C++": "#f34b7d", "C#": "#178600", Swift: "#F05138",
  Kotlin: "#A97BFF", Dart: "#00B4AB", Lua: "#000080", Vim: "#019833",
  Dockerfile: "#384d54", Makefile: "#427819", Jupyter: "#DA5B0B",
};

type SortKey = "updated" | "name" | "stars";
type FilterType = "all" | "public" | "private" | "fork" | "archived";

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<number | string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualError, setManualError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("connected_repo");
    localStorage.removeItem("connected_repo_name");
    router.push("/login");
  };

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch user profile
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setProfile(userData);

      // Fetch GitHub profile for extra details
      const ghRes = await fetch(`https://api.github.com/users/${userData.username}`);
      if (ghRes.ok) setGhProfile(await ghRes.json());

      // Fetch repos
      const res = await fetch(`${API_BASE_URL}/repos/github/${userData.github_id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRepos(data);
      } else if (Array.isArray(data?.items)) {
        setRepos(data.items);
      } else {
        setRepos([]);
        console.error("Unexpected repos response:", data);
      }
    } catch (e) {
      console.error("Error:", e);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const connect = async (repo: Repository) => {
    setConnecting(repo.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/repos/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repo_id: repo.id, name: repo.name, full_name: repo.full_name, owner: repo.owner.login }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("connected_repo", data.repo_id);
        localStorage.setItem("connected_repo_name", data.repo);
        router.push("/dashboard");
      }
    } catch { /* ignore */ } finally { setConnecting(null); }
  };

  const connectManual = async () => {
    setManualError("");
    const match = manualUrl.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
    if (!match) { setManualError("Enter a valid GitHub URL"); return; }
    const owner = match[1], name = match[2].replace(/\.git$/, "");
    setConnecting("manual");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/repos/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repo_id: 0, name, full_name: `${owner}/${name}`, owner }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("connected_repo", data.repo_id);
        localStorage.setItem("connected_repo_name", data.repo);
        router.push("/dashboard");
      } else { setManualError(data.detail || "Failed to connect"); }
    } catch { setManualError("Connection failed"); } finally { setConnecting(null); }
  };

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const memberSince = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const reposList = Array.isArray(repos) ? repos : [];

  // Filter & sort
  const filtered = reposList
    .filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchLang = r.language?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchLang) return false;
      }
      if (filterType === "public") return !r.private;
      if (filterType === "private") return r.private;
      if (filterType === "fork") return r.fork;
      if (filterType === "archived") return r.archived;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stars") return b.stargazers_count - a.stargazers_count;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const languages = [...new Set(reposList.map((r) => r.language).filter(Boolean))];
  const totalStars = reposList.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = reposList.reduce((sum, r) => sum + (r.forks_count || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="w-5 h-5 border-2 border-[#30363d] border-t-[#e6edf3] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header bar */}
      <header className="bg-[#010409] border-b border-[#21262d] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/repositories")} aria-label="Go to repositories" className="rounded-lg">
              <img src="/RepoTrack_Logo.jpg" alt="RepoTrack" className="w-10 h-10 rounded-lg object-contain" />
            </button>
            <span className="text-sm font-semibold text-[#e6edf3]">{profile?.username || "User"}</span>
            <span className="text-[#484f58]">/</span>
            <span className="text-sm font-semibold text-[#e6edf3]">Repositories</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-[#e6edf3] bg-[#21262d] border border-[#30363d] px-3 py-1.5 rounded-md hover:bg-[#30363d] hover:border-[#8b949e] transition-colors"
            >
              Sign out
            </button>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full border border-[#30363d]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d]" />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* ═══ LEFT: User Profile Card ═══ */}
        <aside className="lg:w-[296px] shrink-0">
          {/* Avatar */}
          <div className="mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full max-w-[296px] aspect-square rounded-full border-2 border-[#30363d] bg-[#161b22] object-cover" />
            ) : (
              <div className="w-full max-w-[296px] aspect-square rounded-full bg-[#161b22] border-2 border-[#30363d] flex items-center justify-center">
                <svg className="w-20 h-20 text-[#30363d]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              </div>
            )}
          </div>

          {/* Name & username */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-[#e6edf3] leading-tight">{ghProfile?.name || profile?.username || "User"}</h1>
            <p className="text-lg text-[#7d8590]">{profile?.username || "User"}</p>
          </div>

          {/* Bio */}
          {ghProfile?.bio && (
            <p className="text-sm text-[#e6edf3] mb-4 leading-relaxed">{ghProfile.bio}</p>
          )}

          {/* GitHub profile link */}
          <a href={`https://github.com/${profile?.username}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 text-sm text-[#e6edf3] border border-[#30363d] bg-[#21262d] py-1.5 rounded-md hover:bg-[#30363d] hover:border-[#8b949e] transition-colors mb-4 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            View GitHub Profile
          </a>

          {/* Followers / Following */}
          {ghProfile && (
            <div className="flex items-center gap-2 text-sm text-[#7d8590] mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span><span className="font-semibold text-[#e6edf3]">{ghProfile.followers}</span> followers</span>
              <span>·</span>
              <span><span className="font-semibold text-[#e6edf3]">{ghProfile.following}</span> following</span>
            </div>
          )}

          {/* Details list */}
          <div className="space-y-2 text-sm text-[#7d8590] mb-6">
            {ghProfile?.company && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                <span>{ghProfile.company}</span>
              </div>
            )}
            {ghProfile?.location && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>{ghProfile.location}</span>
              </div>
            )}
            {ghProfile?.blog && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                <a href={ghProfile.blog.startsWith("http") ? ghProfile.blog : `https://${ghProfile.blog}`} target="_blank" rel="noopener noreferrer" className="text-[#388bfd] hover:underline truncate">{ghProfile.blog}</a>
              </div>
            )}
            {ghProfile?.twitter_username && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <a href={`https://twitter.com/${ghProfile.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-[#388bfd] hover:underline">@{ghProfile.twitter_username}</a>
              </div>
            )}
            {ghProfile?.created_at && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>Joined {memberSince(ghProfile.created_at)}</span>
              </div>
            )}
          </div>

          {/* Stats overview */}
          <div className="border-t border-[#21262d] pt-4 mb-4">
            <h2 className="text-xs font-semibold text-[#7d8590] uppercase tracking-wide mb-3">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 text-center">
                <p className="text-lg font-bold text-[#e6edf3]">{repos.length}</p>
                <p className="text-[11px] text-[#7d8590]">Repositories</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 text-center">
                <p className="text-lg font-bold text-[#e6edf3]">{totalStars}</p>
                <p className="text-[11px] text-[#7d8590]">Total Stars</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 text-center">
                <p className="text-lg font-bold text-[#e6edf3]">{totalForks}</p>
                <p className="text-[11px] text-[#7d8590]">Total Forks</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 text-center">
                <p className="text-lg font-bold text-[#e6edf3]">{languages.length}</p>
                <p className="text-[11px] text-[#7d8590]">Languages</p>
              </div>
            </div>
          </div>

          {/* Top Languages */}
          {languages.length > 0 && (
            <div className="border-t border-[#21262d] pt-4">
              <h2 className="text-xs font-semibold text-[#7d8590] uppercase tracking-wide mb-3">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {languages.slice(0, 12).map((lang) => (
                  <span key={lang} className="flex items-center gap-1.5 text-xs text-[#e6edf3] bg-[#161b22] border border-[#30363d] rounded-full px-2.5 py-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: LANG_COLORS[lang] || "#7d8590" }} />
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ═══ RIGHT: Repository List ═══ */}
        <main className="flex-1 min-w-0">
          {/* Manual URL input */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-md p-4 mb-6">
            <label className="text-xs font-medium text-[#e6edf3] mb-2 block">
              Track any repository by URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => { setManualUrl(e.target.value); setManualError(""); }}
                placeholder="https://github.com/owner/repo"
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb] transition-colors"
              />
              <button
                onClick={connectManual}
                disabled={!manualUrl.trim() || connecting === "manual"}
                className="bg-[#238636] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#2ea043] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap border border-[#ffffff1a]"
              >
                {connecting === "manual" ? "Connecting…" : "Track"}
              </button>
            </div>
            {manualError && <p className="text-[#da3633] text-xs mt-2">{manualError}</p>}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a repository…"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-10 pr-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="bg-[#21262d] border border-[#30363d] text-sm text-[#e6edf3] rounded-md px-3 py-2 focus:outline-none focus:border-[#1f6feb] cursor-pointer appearance-none pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%237d8590' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.25em 1.25em" }}
              >
                <option value="all">Type: All</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="fork">Forks</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-[#21262d] border border-[#30363d] text-sm text-[#e6edf3] rounded-md px-3 py-2 focus:outline-none focus:border-[#1f6feb] cursor-pointer appearance-none pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%237d8590' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.25em 1.25em" }}
              >
                <option value="updated">Sort: Last updated</option>
                <option value="name">Name</option>
                <option value="stars">Stars</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs text-[#7d8590] mb-3">
            <span className="font-semibold text-[#e6edf3]">{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""} for <span className="font-semibold text-[#e6edf3]">{profile?.username}</span>
            {search && <> matching &quot;<span className="text-[#e6edf3]">{search}</span>&quot;</>}
          </div>

          {/* Repository list */}
          <div className="border border-[#30363d] rounded-md overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto mb-3 text-[#30363d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                <p className="text-sm text-[#7d8590]">{search ? "No repositories match your search" : "No repositories found"}</p>
              </div>
            ) : (
              filtered.map((repo, i) => (
                <div
                  key={repo.id}
                  className={`px-5 py-4 hover:bg-[#161b22] transition-colors ${i !== 0 ? "border-t border-[#21262d]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Repo name + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <svg className="w-4 h-4 text-[#7d8590] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <button onClick={() => connect(repo)} disabled={connecting === repo.id} className="text-[#388bfd] font-semibold text-base hover:underline truncate">
                          {repo.name}
                        </button>
                        <span className="text-[10px] text-[#7d8590] border border-[#30363d] px-1.5 py-0.5 rounded-full shrink-0">
                          {repo.private ? "Private" : "Public"}
                        </span>
                        {repo.fork && (
                          <span className="text-[10px] text-[#7d8590] border border-[#30363d] px-1.5 py-0.5 rounded-full shrink-0">Fork</span>
                        )}
                        {repo.archived && (
                          <span className="text-[10px] text-[#f78166] border border-[#f7816640] px-1.5 py-0.5 rounded-full shrink-0">Archived</span>
                        )}
                      </div>

                      {/* Description */}
                      {repo.description && (
                        <p className="text-sm text-[#7d8590] mt-1.5 line-clamp-2 leading-relaxed">{repo.description}</p>
                      )}

                      {/* Topics */}
                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {repo.topics.slice(0, 5).map((topic) => (
                            <span key={topic} className="text-[11px] text-[#388bfd] bg-[#388bfd15] px-2 py-0.5 rounded-full font-medium hover:bg-[#388bfd25] transition-colors cursor-default">{topic}</span>
                          ))}
                          {repo.topics.length > 5 && (
                            <span className="text-[11px] text-[#484f58]">+{repo.topics.length - 5} more</span>
                          )}
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-4 mt-2.5 text-xs text-[#7d8590]">
                        {repo.language && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: LANG_COLORS[repo.language] || "#7d8590" }} />
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                            {repo.stargazers_count}
                          </span>
                        )}
                        {repo.forks_count > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                            {repo.forks_count}
                          </span>
                        )}
                        {repo.open_issues_count > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>
                            {repo.open_issues_count}
                          </span>
                        )}
                        <span>Updated {timeAgo(repo.updated_at)}</span>
                      </div>
                    </div>

                    {/* Track button */}
                    <div className="shrink-0 pt-1">
                      <button
                        onClick={() => connect(repo)}
                        disabled={connecting === repo.id}
                        className="text-xs text-[#e6edf3] bg-[#21262d] border border-[#30363d] rounded-md px-3 py-1.5 hover:bg-[#30363d] hover:border-[#8b949e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5"
                      >
                        {connecting === repo.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#30363d] border-t-[#e6edf3] rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        )}
                        Track
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
