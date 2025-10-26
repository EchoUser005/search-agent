"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-light.css";
import { streamSearch, type StreamEvent } from "@/lib/api";

interface Message {
  type: "thinking" | "tool_call" | "tool_result" | "response" | "error";
  content: string;
}

export default function SearchAgent() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentThinking, setCurrentThinking] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThinking]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setMessages([]);
    setCurrentThinking("");

    let buffer = "";

    streamSearch(
      query,
      (event: StreamEvent) => {
        switch (event.type) {
          case "content":
            buffer += event.content || "";
            setCurrentThinking(buffer);
            break;

          case "tool_call":
            if (buffer) {
              setMessages((prev) => [
                ...prev,
                {
                  type: "thinking",
                  content: buffer,
                },
              ]);
              buffer = "";
              setCurrentThinking("");
            }
            setMessages((prev) => [
              ...prev,
              {
                type: "tool_call",
                content: `${event.arguments}`,
              },
            ]);
            break;

          case "tool_result":
            if (event.data) {
              const results = Object.entries(event.data)
                .map(([key, value]: [string, any]) => {
                  if (Array.isArray(value) && value.length > 0) {
                    return (
                      `**${key}:**\n` +
                      value
                        .map((item: any) => {
                          return `- [${item.title}](${item.url})\n  ${item.snippet}`;
                        })
                        .join("\n")
                    );
                  }
                  return null;
                })
                .filter(Boolean)
                .join("\n\n");

              setMessages((prev) => [
                ...prev,
                {
                  type: "tool_result",
                  content: `${results}`,
                },
              ]);
            }
            break;

          case "done":
            if (buffer) {
              setMessages((prev) => [
                ...prev,
                {
                  type: "response",
                  content: buffer,
                },
              ]);
            }
            setCurrentThinking("");
            setLoading(false);
            break;

          case "error":
            setMessages((prev) => [
              ...prev,
              {
                type: "error",
                content: `❌ Error: ${event.error}`,
              },
            ]);
            setLoading(false);
            break;
        }
      },
      (error: string) => {
        setMessages((prev) => [
          ...prev,
          {
            type: "error",
            content: `Failed to connect: ${error}`,
          },
        ]);
        setLoading(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSearch();
            }
          }}
          placeholder="你可以问：给我一个下周去云南的7日游计划"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⟳</span> Searching
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !currentThinking && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Enter a query to get started</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-2">
              {msg.type === "thinking" && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    💭 Thinking
                  </p>
                  <div className="text-sm text-blue-800 prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {msg.type === "tool_call" && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                  <p className="text-sm font-semibold text-amber-900 mb-2">
                   Tool: search
                  </p>
                  <details className="text-sm text-amber-800">
                    <summary className="cursor-pointer hover:text-amber-600 font-medium">
                      展开
                    </summary>
                    <div className="mt-2 bg-white rounded p-2 text-xs overflow-x-auto">
                      <pre>{msg.content}</pre>
                    </div>
                  </details>
                </div>
              )}

              {msg.type === "tool_result" && (
                  <details className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <summary className="cursor-pointer font-semibold text-green-900 hover:text-green-700">
                      搜索结果:
                    </summary>
                    <div className="mt-3 text-sm text-green-800 prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </details>
                )}

              {msg.type === "response" && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    📝 Response
                  </p>
                  <div className="text-sm text-gray-800 prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {msg.type === "error" && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="text-sm text-red-800">{msg.content}</div>
                </div>
              )}
            </div>
          ))}

          {currentThinking && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded animate-pulse">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                💭 Thinking...
              </p>
              <div className="text-sm text-blue-800">{currentThinking}</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}