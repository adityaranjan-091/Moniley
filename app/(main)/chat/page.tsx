"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

// ── Types ────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

type Conversation = {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

// ── Suggested Prompts ────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  {
    icon: "📊",
    title: "Monthly Overview",
    prompt: "Give me a detailed overview of my spending this month.",
  },
  {
    icon: "💡",
    title: "Savings Tips",
    prompt: "Where can I cut back and save more money?",
  },
  {
    icon: "🎯",
    title: "Budget Check",
    prompt: "Am I on track with my budgets this month?",
  },
  {
    icon: "📈",
    title: "Spending Patterns",
    prompt: "Analyze my spending patterns and give me insights.",
  },
];

// ── Markdown-ish renderer (lightweight) ──────────────────────────────

function renderMarkdown(text: string) {
  // Split into lines, process each
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-2 ml-4 space-y-1 list-disc">
          {listItems}
        </ul>,
      );
      listItems = [];
      inList = false;
    }
  };

  const processInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Bold: **text**
    const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(
          <strong key={match.index} className="font-semibold">
            {match[2]}
          </strong>,
        );
      } else if (match[4]) {
        parts.push(
          <code
            key={match.index}
            className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono"
          >
            {match[4]}
          </code>,
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    return parts.length > 0 ? parts : [line];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (trimmed === "") {
      flushList();
      elements.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={idx} className="mt-3 mb-1 text-sm font-bold text-foreground">
          {processInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={idx} className="mt-3 mb-1 text-base font-bold text-foreground">
          {processInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }

    // List items
    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      /^\d+\.\s/.test(trimmed)
    ) {
      inList = true;
      const content = trimmed.replace(/^[-*]\s|^\d+\.\s/, "");
      listItems.push(
        <li key={idx} className="text-sm leading-relaxed">
          {processInline(content)}
        </li>,
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={idx} className="text-sm leading-relaxed">
        {processInline(trimmed)}
      </p>,
    );
  });

  flushList();
  return elements;
}

// ── Main Component ───────────────────────────────────────────────────

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.email || "";
  const sessionReady = !authLoading && !!userId;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Fetch conversation list ──
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setLoadingHistory(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/chat/history?userId=${encodeURIComponent(userId)}`,
      );
      const json = await res.json();
      if (json.success) {
        setConversations(json.conversations);
      }
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading) fetchConversations();
  }, [authLoading, fetchConversations]);

  // ── Load a conversation ──
  const loadConversation = useCallback(
    async (convId: string) => {
      if (!userId) return;
      try {
        const res = await fetch(
          `/api/chat/history?userId=${encodeURIComponent(userId)}&conversationId=${convId}`,
        );
        const json = await res.json();
        if (json.success) {
          setMessages(json.conversation.messages || []);
          setActiveConversationId(convId);
        }
      } catch (e) {
        console.error("Failed to load conversation", e);
      }
    },
    [userId],
  );

  // ── New chat ──
  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  // ── Delete conversation ──
  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/history?id=${convId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConversationId === convId) startNewChat();
    } catch (e) {
      console.error("Failed to delete conversation", e);
    }
  };

  // ── Scroll management ──
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!atBottom);
  }, []);

  // ── Send message ──
  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isStreaming || !sessionReady) return;

    const userMsg: Message = { role: "user", content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          userId,
          conversationId: activeConversationId,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));

            if (payload.error) {
              console.error("Stream error:", payload.error);
              break;
            }

            if (payload.done) {
              // Update conversation ID if new
              if (payload.conversationId) {
                setActiveConversationId(payload.conversationId);
                fetchConversations();
              }
              break;
            }

            if (payload.text) {
              accumulated += payload.text;
              const currentAccum = accumulated;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: currentAccum,
                };
                return updated;
              });
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // ── Handle textarea input ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  // ── Format time ──
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // ── Render ──
  return (
    <div className="flex h-[calc(100svh-5rem)] gap-0 -m-6 md:-m-8">
      {/* ═══ SIDEBAR — Conversation History ═══ */}
      <div
        className={`
                    flex flex-col border-r border-border bg-card/50 backdrop-blur-sm
                    transition-all duration-300 ease-in-out overflow-hidden shrink-0
                    ${sidebarOpen ? "w-72" : "w-0"}
                `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              History
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={startNewChat}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No conversations yet
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                role="button"
                tabIndex={0}
                onClick={() => loadConversation(conv._id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && loadConversation(conv._id)
                }
                className={`
                                    group w-full flex items-center gap-2 rounded-lg px-3 py-2.5
                                    text-left text-sm transition-all duration-150 cursor-pointer
                                    hover:bg-primary/5
                                    ${
                                      activeConversationId === conv._id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:text-foreground"
                                    }
                                `}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{conv.title}</p>
                  <p className="text-[10px] opacity-50 mt-0.5">
                    {timeAgo(conv.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv._id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/30 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground leading-tight">
                Moniley AI Advisor
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Powered by your financial data
              </p>
            </div>
          </div>
          {activeConversationId && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-xs h-7 gap-1"
              onClick={startNewChat}
            >
              <Plus className="w-3 h-3" />
              New Chat
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
        >
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Hi! I&apos;m your Financial Advisor
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                I have access to your real financial data. Ask me anything about
                your spending, budgets, savings, or get personalized advice.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map((sp) => (
                  <button
                    key={sp.title}
                    onClick={() => sendMessage(sp.prompt)}
                    className="
                                            group flex items-start gap-3 p-4 rounded-xl
                                            bg-card border border-border
                                            hover:border-primary/30 hover:bg-primary/5
                                            transition-all duration-200 text-left
                                            hover:shadow-md hover:shadow-primary/5
                                        "
                  >
                    <span className="text-xl shrink-0 mt-0.5">{sp.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {sp.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {sp.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`
                                            max-w-[80%] rounded-2xl px-4 py-3
                                            ${
                                              msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-card border border-border rounded-bl-md shadow-sm"
                                            }
                                        `}
                  >
                    {msg.role === "assistant" ? (
                      msg.content ? (
                        <div className="prose-sm">
                          {renderMarkdown(msg.content)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1">
                            <span
                              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Analyzing your finances...
                          </span>
                        </div>
                      )
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-lg h-8 w-8"
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Input area ── */}
        <div className="border-t border-border bg-card/30 backdrop-blur-sm px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your finances..."
                  disabled={isStreaming}
                  rows={1}
                  className="
                                        w-full resize-none rounded-xl border border-border
                                        bg-background px-4 py-3 pr-12 text-sm
                                        placeholder:text-muted-foreground
                                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                        disabled:opacity-50 transition-all
                                        max-h-40 scrollbar-thin
                                    "
                />
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="
                                    h-11 w-11 rounded-xl shrink-0
                                    bg-primary hover:bg-primary/90
                                    disabled:opacity-30
                                    transition-all duration-200
                                    shadow-md shadow-primary/20
                                "
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-60">
              Moniley AI uses your financial data for personalized advice. Press
              Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
