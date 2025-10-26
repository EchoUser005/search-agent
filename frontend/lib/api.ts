export interface StreamEvent {
  type: "content" | "tool_call" | "tool_result" | "error" | "done";
  content?: string;
  tool_name?: string;
  arguments?: string;
  data?: Record<string, any>;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function streamSearch(
  query: string,
  onEvent: (event: StreamEvent) => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event);
          } catch (e) {
            console.error("Failed to parse event:", line);
          }
        }
      }

      buffer = lines[lines.length - 1];
    }

    if (buffer.trim().startsWith("data: ")) {
      try {
        const event = JSON.parse(buffer.slice(6));
        onEvent(event);
      } catch (e) {
        console.error("Failed to parse final event:", buffer);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    onError(errorMsg);
  }
}