import { API_BASE_URL } from "./config";

interface Activity {
  actor: string;
  event_type: string;
  message: string;
  repo_full_name: string;
  timestamp: string;
}

export const connectActivitySocket = (
    repoID: string,
    token: string,
    onMessage: (data: Activity) => void
) => {
    const wsUrl = API_BASE_URL.replace("http://", "ws://").replace("https://", "wss://");
    const ws = new WebSocket(
        `${wsUrl}/ws/activities/${repoID}?token=${token}`
    );

    ws.onmessage = (event) => {
        onMessage(JSON.parse(event.data));
    };

    return ws;
}