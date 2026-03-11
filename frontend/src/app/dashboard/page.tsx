"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { connectActivitySocket } from "@/lib/socket";

type Tab = "activity" | "integrations" | "settings";

interface Activity {
  actor: string;
  event_type: string;
  message: string;
  repo_full_name: string;
  timestamp: string;
}

interface UserProfile {
  username: string;
  avatar_url: string;
  github_id: number;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  stargazers_count: number;
  language: string;
  updated_at: string;
}

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  connected: boolean;
  webhookField?: string;
  placeholder?: string;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  PHP: "#4F5D95", CSS: "#563d7c", HTML: "#e34c26", Shell: "#89e051",
  C: "#555555", "C++": "#f34b7d", "C#": "#178600", Swift: "#F05138",
  Kotlin: "#A97BFF", Dart: "#00B4AB",
};

export default function DashboardPage() {
  const [repoName, setRepoName] = useState("");
  const [repoId, setRepoId] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRepos, setUserRepos] = useState<Repository[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhookValues, setWebhookValues] = useState<Record<string, string>>({});
  const [savingIntegration, setSavingIntegration] = useState<string | null>(null);
  const [savedIntegration, setSavedIntegration] = useState<string | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitySource, setActivitySource] = useState<"webhook" | "github">("webhook");
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        const reposRes = await fetch(`${API_BASE_URL}/repos/github/${data.github_id}`);
        if (reposRes.ok) {
          const repos = await reposRes.json();
          const sorted = repos
            .sort((a: Repository, b: Repository) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            .slice(0, 6);
          setUserRepos(sorted);
        }
      }
    } catch { /* ignore */ } finally { setLoadingRepos(false); }
  }, []);

  const fetchActivities = useCallback(async (rid: string, repoFullName: string) => {
    setLoadingActivities(true);
    try {
      const token = localStorage.getItem("token");
      // First try stored webhook activities
      const res = await fetch(`${API_BASE_URL}/activities/${rid}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activities && data.activities.length > 0) {
          setActivities(data.activities);
          setActivitySource("webhook");
          setLoadingActivities(false);
          return;
        }
      }
      // Fallback: fetch recent events from GitHub API
      if (repoFullName) {
        const ghRes = await fetch(`${API_BASE_URL}/activities/github-events/${repoFullName}?limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          setActivities(ghData.events || []);
          setActivitySource("github");
        }
      }
    } catch { /* ignore */ } finally { setLoadingActivities(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const connectedRepo = localStorage.getItem("connected_repo");
    const connectedRepoName = localStorage.getItem("connected_repo_name");
    if (!token || !connectedRepo) { router.push("/login"); return; }

    setRepoId(connectedRepo);
    setRepoName(connectedRepoName || connectedRepo);
    fetchProfile();
    fetchActivities(connectedRepo, connectedRepoName || connectedRepo);

    const ws = connectActivitySocket(connectedRepo, token, (data) => {
      setActivities((prev) => [data, ...prev]);
    });

    setIntegrations([
      { id: "discord", name: "Discord", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>), description: "Real-time push, PR & issue alerts in your Discord channel.", color: "#5865F2", connected: false, webhookField: "discord_webhook", placeholder: "https://discord.com/api/webhooks/..." },
      { id: "slack", name: "Slack", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z"/></svg>), description: "Push notifications into your Slack workspace channels.", color: "#E01E5A", connected: false, webhookField: "slack_webhook", placeholder: "https://hooks.slack.com/services/..." },
      { id: "telegram", name: "Telegram", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>), description: "Instant bot messages for every repo event.", color: "#26A5E4", connected: false, webhookField: "telegram_webhook", placeholder: "https://api.telegram.org/bot.../sendMessage" },
      { id: "email", name: "Email", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>), description: "Digest or instant email alerts for pushes, PRs & issues.", color: "#EA4335", connected: false, webhookField: "email_address", placeholder: "your@email.com" },
      { id: "teams", name: "Microsoft Teams", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.404 4.636h-2.99V1.723a1.723 1.723 0 00-3.446 0v2.913H9.03V1.723a1.723 1.723 0 10-3.447 0v2.913H2.596A2.596 2.596 0 000 7.232v2.989h4.636v3.94H1.723a1.723 1.723 0 000 3.447h2.913v2.989a2.596 2.596 0 002.596 2.596h2.99v-4.636h3.94v2.913a1.723 1.723 0 003.446 0v-2.913h2.99a2.596 2.596 0 002.596-2.596v-2.99h-4.636v-3.94h2.913a1.723 1.723 0 000-3.446h-2.913V7.232a2.596 2.596 0 00-2.596-2.596zm-5.233 9.524H9.928V9.918h4.243v4.242z"/></svg>), description: "Post repo updates to your Teams channel via webhooks.", color: "#6264A7", connected: false, webhookField: "teams_webhook", placeholder: "https://outlook.office.com/webhook/..." },
      { id: "webhook", name: "Custom Webhook", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>), description: "Send JSON payloads to any endpoint you own.", color: "#7d8590", connected: false, webhookField: "custom_webhook", placeholder: "https://your-server.com/webhook" },
    ]);

    loadIntegrations(connectedRepo);
    return () => ws.close();
  }, [router, fetchProfile, fetchActivities]);

  const loadIntegrations = async (repoId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/integrations/${repoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookValues(data || {});
        setIntegrations((prev) => prev.map((i) => ({ ...i, connected: !!(i.webhookField && data[i.webhookField]) })));
      }
    } catch { /* no saved integrations yet */ }
  };

  const saveIntegration = async (integration: Integration) => {
    const field = integration.webhookField;
    if (!field) return;
    const value = webhookValues[field];
    if (!value?.trim()) return;
    setSavingIntegration(integration.id);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, string> = { repo_id: repoId };
      body[field] = value;
      const res = await fetch(`${API_BASE_URL}/integrations/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setIntegrations((prev) => prev.map((i) => (i.id === integration.id ? { ...i, connected: true } : i)));
        setSavedIntegration(integration.id);
        setTimeout(() => setSavedIntegration(null), 2000);
      }
    } catch { /* ignore */ } finally { setSavingIntegration(null); }
  };

  const disconnectIntegration = async (integration: Integration) => {
    const field = integration.webhookField;
    if (!field) return;
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, string | null> = { repo_id: repoId };
      body[field] = "";
      await fetch(`${API_BASE_URL}/integrations/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setIntegrations((prev) => prev.map((i) => (i.id === integration.id ? { ...i, connected: false } : i)));
      setWebhookValues((prev) => ({ ...prev, [field]: "" }));
    } catch { /* ignore */ }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };
  const handleChangeRepo = () => {
    localStorage.removeItem("connected_repo");
    localStorage.removeItem("connected_repo_name");
    router.push("/repositories");
  };

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  const groupedActivities = activities.reduce<Record<string, Activity[]>>((groups, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {});

  const eventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "push": return "text-[#3fb950] bg-[#23863620]";
      case "pull_request": case "pull_request_review": case "pull_request_review_comment": return "text-[#388bfd] bg-[#1f6feb20]";
      case "issues": case "issue_comment": return "text-[#db61a2] bg-[#db61a220]";
      case "star": case "fork": return "text-[#d29922] bg-[#d2992220]";
      case "release": return "text-[#a371f7] bg-[#a371f720]";
      case "create": case "delete": return "text-[#79c0ff] bg-[#79c0ff20]";
      default: return "text-[#7d8590] bg-[#7d859020]";
    }
  };

  const eventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "push": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A2.5 2.5 0 013.5 0h8.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V1.5h-8A1 1 0 002.5 2.5v9A1 1 0 003.5 12H5v-2a.75.75 0 011.5 0v3.5a.75.75 0 01-.75.75H3.5A2.5 2.5 0 011 11.5v-9z"/></svg>);
      case "pull_request": case "pull_request_review": case "pull_request_review_comment": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>);
      case "issues": case "issue_comment": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>);
      case "star": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>);
      case "fork": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>);
      case "release": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.752 1.752 0 011 7.775zM6 5a1 1 0 100-2 1 1 0 000 2z"/></svg>);
      case "create": case "delete": return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z"/></svg>);
      default: return (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm.25-11.25v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 011.5 0zM8 12a1 1 0 110-2 1 1 0 010 2z"/></svg>);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* GitHub-style header */}
      <header className="bg-[#010409] border-b border-[#21262d] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/repositories")} aria-label="Go to repositories" className="rounded-lg">
              <img src="/RepoTrack_Logo.jpg" alt="RepoTrack" className="w-10 h-10 rounded-lg object-contain" />
            </button>
            <div className="hidden sm:flex items-center bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1.5 w-72">
              <svg className="w-4 h-4 text-[#484f58] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span className="text-sm text-[#484f58]">Type <kbd className="text-[11px] border border-[#30363d] rounded px-1 py-0.5 text-[#7d8590]">/</kbd> to search</span>
            </div>
            <nav className="hidden md:flex items-center gap-4 ml-2">
              <button onClick={handleChangeRepo} className="text-sm text-[#e6edf3] hover:text-[#e6edf3]/80 font-medium">Repositories</button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleChangeRepo} className="text-[#e6edf3] text-xs border border-[#30363d] bg-[#21262d] px-3 py-1.5 rounded-md hover:bg-[#30363d] hover:border-[#8b949e] transition-colors">Switch repo</button>
            <div className="w-px h-5 bg-[#21262d]" />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-8 h-8 rounded-full border border-[#30363d]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d]" />
            )}
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="max-w-[1280px] mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="lg:w-[296px] shrink-0">
          {/* Avatar */}
          <div className="mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-[296px] h-[296px] rounded-full border-2 border-[#30363d] bg-[#161b22] object-cover" />
            ) : (
              <div className="w-[296px] h-[296px] rounded-full bg-[#161b22] border-2 border-[#30363d] flex items-center justify-center">
                <svg className="w-24 h-24 text-[#30363d]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#e6edf3] leading-tight">{profile?.username || "User"}</h1>
            <p className="text-lg text-[#7d8590]">{profile?.username || "User"}</p>
          </div>

          <button onClick={handleLogout} className="w-full text-sm text-[#e6edf3] border border-[#30363d] bg-[#21262d] py-1.5 rounded-md hover:bg-[#30363d] hover:border-[#8b949e] transition-colors mb-6 font-medium">Sign out</button>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-[#7d8590] mb-6">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              <span className="font-semibold text-[#e6edf3]">{userRepos.length}</span> repos
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span className="font-semibold text-[#e6edf3]">{activities.length}</span> events
            </div>
          </div>

          {/* Currently tracking */}
          <div className="border border-[#238636] rounded-md p-3 bg-[#23863610] mb-6">
            <div className="flex items-center gap-2 text-xs text-[#3fb950] mb-1">
              <span className="w-2 h-2 bg-[#238636] rounded-full animate-pulse" />
              Currently tracking
            </div>
            <p className="text-sm font-semibold text-[#e6edf3]">{repoName}</p>
          </div>

          <div className="border-t border-[#21262d] pt-4 mb-4">
            <h2 className="text-sm font-semibold text-[#e6edf3] mb-3">Top Repositories</h2>
          </div>

          {loadingRepos ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-md bg-[#161b22] animate-pulse"/>)}</div>
          ) : (
            <div className="space-y-1">
              {userRepos.map((repo) => (
                <div key={repo.id} className="rounded-md p-3 hover:bg-[#161b22] transition-colors group cursor-default">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#7d8590] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    <span className="text-sm font-semibold text-[#388bfd] truncate group-hover:underline">{repo.name}</span>
                    <span className="text-[10px] text-[#7d8590] border border-[#30363d] px-1.5 py-0.5 rounded-full shrink-0 ml-auto">{repo.private ? "Private" : "Public"}</span>
                  </div>
                  {repo.description && <p className="text-xs text-[#7d8590] mt-1 truncate pl-6">{repo.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#7d8590] pl-6">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: LANG_COLORS[repo.language] || "#7d8590" }} />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                        {repo.stargazers_count}
                      </span>
                    )}
                    <span>Updated {timeAgo(repo.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="border-t border-[#21262d] pt-4 mt-4">
            <h2 className="text-sm font-semibold text-[#e6edf3] mb-3">Quick Links</h2>
            <div className="space-y-1">
              <a href={`https://github.com/${repoName}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#7d8590] hover:text-[#388bfd] py-1.5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                View on GitHub
              </a>
              <a href={`https://github.com/${repoName}/pulls`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#7d8590] hover:text-[#388bfd] py-1.5 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>
                Pull Requests
              </a>
              <a href={`https://github.com/${repoName}/issues`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#7d8590] hover:text-[#388bfd] py-1.5 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>
                Issues
              </a>
            </div>
          </div>
        </aside>

        {/* ═══ RIGHT MAIN CONTENT ═══ */}
        <main className="flex-1 min-w-0">
          {/* Underline tabs */}
          <div className="border-b border-[#21262d] mb-6">
            <nav className="flex gap-0 -mb-px">
              {([
                { key: "activity" as Tab, label: "Activity", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 108 0a8 8 0 000 16zM6.5 7.5A.75.75 0 016.5 6h3a.75.75 0 010 1.5h-1.75v3.75a.75.75 0 01-1.5 0V7.5z"/></svg>) },
                { key: "integrations" as Tab, label: "Integrations", count: connectedCount, icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>) },
                { key: "settings" as Tab, label: "Settings", icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>) },
              ]).map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${activeTab === tab.key ? "border-[#f78166] text-[#e6edf3] font-semibold" : "border-transparent text-[#7d8590] hover:text-[#e6edf3] hover:border-[#30363d]"}`}>
                  {tab.icon}
                  {tab.label}
                  {"count" in tab && tab.count ? (<span className="bg-[#1f6feb26] text-[#388bfd] text-[10px] px-1.5 py-0.5 rounded-full font-medium">{tab.count}</span>) : null}
                </button>
              ))}
            </nav>
          </div>

          {/* ─── Activity Tab ─── */}
          {activeTab === "activity" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-[#e6edf3]">Activity History</h2>
                  {activitySource === "github" && activities.length > 0 && (
                    <span className="text-[10px] text-[#7d8590] bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded-full">
                      via GitHub API
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#7d8590]">
                  <span className="w-2 h-2 bg-[#238636] rounded-full animate-pulse" />
                  Live
                </div>
              </div>

              {activitySource === "github" && activities.length > 0 && (
                <div className="mb-4 border border-[#1f6feb40] rounded-md bg-[#1f6feb10] px-4 py-3">
                  <p className="text-xs text-[#388bfd]">
                    📡 Showing recent activity from the GitHub API. Once webhook events start arriving, they&apos;ll appear here in real time.
                  </p>
                </div>
              )}

              {loadingActivities ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="border border-[#30363d] rounded-md bg-[#161b22] p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#21262d] animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-[#21262d] rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-[#21262d] rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16 border border-[#30363d] rounded-md bg-[#161b22]">
                  <svg className="w-12 h-12 mx-auto mb-3 text-[#30363d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <p className="text-sm text-[#7d8590]">No activity yet</p>
                  <p className="text-xs text-[#484f58] mt-1">Push, open a PR, or create an issue to see events here.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-[#21262d]" />

                  {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                    <div key={date} className="mb-6">
                      {/* Date header */}
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#161b22] border-2 border-[#21262d] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-[#7d8590]" fill="currentColor" viewBox="0 0 16 16"><path d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h-2a.25.25 0 00-.25.25V6h11V3.75a.25.25 0 00-.25-.25h-2v.75a.75.75 0 01-1.5 0v-.75h-5v.75a.75.75 0 01-1.5 0v-.75zm7.75 4H2.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5z"/></svg>
                        </div>
                        <h3 className="text-sm font-semibold text-[#e6edf3]">{date}</h3>
                      </div>

                      {/* Events */}
                      <div className="space-y-2 pl-12">
                        {dayActivities.map((activity, index) => (
                          <div key={index} className="border border-[#30363d] rounded-md bg-[#161b22] hover:bg-[#1c2129] transition-colors overflow-hidden">
                            <div className="px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${eventColor(activity.event_type)}`}>
                                  {eventIcon(activity.event_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-[#e6edf3]">{activity.actor}</span>
                                    <span className="text-sm text-[#7d8590]">{activity.message}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-medium text-[#388bfd] bg-[#1f6feb15] px-2 py-0.5 rounded-full border border-[#1f6feb30]">{activity.event_type}</span>
                                    <span className="text-xs text-[#484f58]">{activity.repo_full_name}</span>
                                    <span className="text-xs text-[#484f58]">{timeAgo(activity.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Integrations Tab ─── */}
          {activeTab === "integrations" && (
            <div>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-[#e6edf3] mb-1">Integrations</h2>
                <p className="text-sm text-[#7d8590]">Connect platforms to receive notifications wherever you work.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => (
                  <div key={integration.id} className={`border rounded-md p-5 transition-colors ${integration.connected ? "border-[#238636] bg-[#0d1117]" : "border-[#30363d] bg-[#161b22] hover:border-[#484f58]"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: integration.color + "20", color: integration.color }}>{integration.icon}</div>
                      <div>
                        <h3 className="text-sm font-medium text-[#e6edf3]">{integration.name}</h3>
                        {integration.connected && (<span className="text-[10px] text-[#3fb950] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#238636] rounded-full" />Connected</span>)}
                      </div>
                    </div>
                    <p className="text-xs text-[#7d8590] mb-4 leading-relaxed">{integration.description}</p>
                    {integration.webhookField && (
                      <div className="space-y-2">
                        <input type="text" value={webhookValues[integration.webhookField] || ""} onChange={(e) => setWebhookValues((prev) => ({ ...prev, [integration.webhookField!]: e.target.value }))} placeholder={integration.placeholder} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb] transition-colors font-mono" />
                        <div className="flex gap-2">
                          <button onClick={() => saveIntegration(integration)} disabled={savingIntegration === integration.id || !webhookValues[integration.webhookField]?.trim()} className="flex-1 bg-[#238636] text-white text-xs py-2 rounded-md hover:bg-[#2ea043] transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium border border-[#ffffff1a]">
                            {savingIntegration === integration.id ? "Saving…" : savedIntegration === integration.id ? "✓ Saved" : integration.connected ? "Update" : "Connect"}
                          </button>
                          {integration.connected && (<button onClick={() => disconnectIntegration(integration)} className="text-[#da3633] text-xs py-2 px-3 rounded-md hover:bg-[#da363315] border border-[#30363d] transition-colors">Remove</button>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Settings Tab ─── */}
          {activeTab === "settings" && (
            <div>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-[#e6edf3] mb-1">Settings</h2>
                <p className="text-sm text-[#7d8590]">Manage your tracked repository and preferences.</p>
              </div>
              <div className="space-y-4">
                <div className="border border-[#30363d] rounded-md p-5 bg-[#161b22]">
                  <h3 className="text-sm font-medium text-[#e6edf3] mb-3">Tracked Repository</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => router.push("/repositories")} aria-label="Go to repositories" className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src="/RepoTrack_Logo.jpg" alt="RepoTrack" className="w-10 h-10 rounded-lg object-contain" />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-[#e6edf3]">{repoName}</p>
                        <p className="text-xs text-[#484f58]">ID: {repoId}</p>
                      </div>
                    </div>
                    <button onClick={handleChangeRepo} className="text-xs text-[#e6edf3] border border-[#30363d] bg-[#21262d] px-3 py-1.5 rounded-md hover:bg-[#30363d] hover:border-[#8b949e] transition-colors">Change</button>
                  </div>
                </div>
                <div className="border border-[#30363d] rounded-md p-5 bg-[#161b22]">
                  <h3 className="text-sm font-medium text-[#e6edf3] mb-3">Events to Track</h3>
                  <div className="space-y-2.5">
                    {["Push", "Pull Request", "Issues", "Branch Created", "Branch Deleted", "Release"].map((event) => (
                      <label key={event} className="flex items-center gap-3 text-sm text-[#7d8590] cursor-pointer hover:text-[#e6edf3] transition-colors">
                        <input type="checkbox" defaultChecked className="accent-[#238636] w-3.5 h-3.5 rounded bg-[#0d1117] border-[#30363d]" />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border border-[#da363380] rounded-md p-5 bg-[#161b22]">
                  <h3 className="text-sm font-medium text-[#da3633] mb-1">Danger Zone</h3>
                  <p className="text-xs text-[#7d8590] mb-3">Disconnect this repository and remove all integration settings.</p>
                  <button onClick={handleChangeRepo} className="text-xs text-[#da3633] border border-[#da363380] px-4 py-2 rounded-md hover:bg-[#da363315] hover:border-[#da3633] transition-colors">Disconnect Repository</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
