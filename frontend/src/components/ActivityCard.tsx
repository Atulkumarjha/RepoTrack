"use client";

type ActivityProps = {
  actor: string;
  event_type: string;
  message: string;
  repo_full_name: string;
  timestamp: string;
};

export default function ActivityCard({
  actor,
  event_type,
  message,
  repo_full_name,
  timestamp,
}: ActivityProps) {
  return (
    <div className="border border-[#30363d] rounded-md px-4 py-3.5 bg-[#161b22] hover:bg-[#1c2129] transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#7d8590]">{repo_full_name}</span>
        <span className="text-[10px] font-medium text-[#388bfd] bg-[#1f6feb26] px-2 py-0.5 rounded-full">
          {event_type}
        </span>
      </div>

      <div className="mt-1.5 text-sm">
        <span className="font-medium text-[#e6edf3]">{actor}</span>{" "}
        <span className="text-[#7d8590]">{message}</span>
      </div>

      <div className="text-[11px] text-[#484f58] mt-2">
        {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
}
