"use client";

import { useEffect, useState } from "react";
import ActivityCard from "./ActivityCard";
import { connectActivitySocket } from "@/lib/socket";
import { API_BASE_URL } from "@/lib/config";

interface Activity {
  actor: string;
  event_type: string;
  message: string;
  repo_full_name: string;
  timestamp: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [repoId, setRepoId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRepo = localStorage.getItem("connected_repo");
    setToken(storedToken);
    setRepoId(storedRepo);
  }, []);

  useEffect(() => {
    if (!token || !repoId) return;
    const ws = connectActivitySocket(repoId, token, (data) => {
      setActivities((prev) => [data, ...prev]);
    });
    return () => ws.close();
  }, [token, repoId]);

  useEffect(() => {
    if (!token || !repoId) return;
    const fetchHistory = async () => {
      const res = await fetch(`${API_BASE_URL}/activities/${repoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActivities(data.activities);
    };
    fetchHistory();
  }, [token, repoId]);

  return (
    <div className="space-y-2">
      {activities.length === 0 && (
        <div className="text-center py-16 border border-[#30363d] rounded-md bg-[#161b22]">
          <svg className="w-10 h-10 mx-auto mb-3 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm text-[#7d8590]">No activity yet</p>
          <p className="text-xs text-[#484f58] mt-1">Events will appear here in real time.</p>
        </div>
      )}
      {activities.map((activity, index) => (
        <ActivityCard key={index} {...activity} />
      ))}
    </div>
  );
}
