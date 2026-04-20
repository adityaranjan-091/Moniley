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
  User,
  Zap,
  TrendingUp,
  PiggyBank,
  Target,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    icon: TrendingUp,
    title: "Monthly Overview",
    prompt: "Give me a detailed overview of my spending this month.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: PiggyBank,
    title: "Savings Tips",
    prompt: "Where can I cut back and save more money?",
    gradient: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-500",
  },
  {
    icon: Target,
    title: "Budget Check",
    prompt: "Am I on track with my budgets this month?",
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
  },
  {
    icon: Zap,
    title: "Smart Insights",
    prompt: "Analyze my spending patterns and give me insights.",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
  },
];

// ── Markdown-ish renderer (lightweight) ──────────────────────────────

function renderMarkdown(text: string) {
  // Split into lines, process each
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${listKey++}`}
          className="my-2 ml-4 space-y-1.5 list-none"
        >
          {listItems}
        </ul>,
      );
      listItems = [];
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
          <strong key={match.index} className="font-semibold text-foreground">
            {match[2]}
          </strong>,
        );
      } else if (match[4]) {
        parts.push(
          <code
            key={match.index}
            className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary border border-primary/10"
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
        <h4
          key={idx}
          className="mt-4 mb-1.5 text-sm font-bold text-foreground flex items-center gap-2"
        >
          <span className="w-1 h-4 rounded-full bg-primary/60 shrink-0" />
          {processInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={idx}
          className="mt-4 mb-1.5 text-base font-bold text-foreground flex items-center gap-2"
        >
          <span className="w-1.5 h-5 rounded-full bg-primary/60 shrink-0" />
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
      const content = trimmed.replace(/^[-*]\s|^\d+\.\s/, "");
      listItems.push(
        <li
          key={idx}
          className="text-sm leading-relaxed flex items-start gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0" />
          <span>{processInline(content)}</span>
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

// ── Typing Indicator Component ───────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex gap-1.5 items-center">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40"
            style={{ animationDuration: "1.4s" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/70" />
        </span>
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40"
            style={{ animationDuration: "1.4s", animationDelay: "200ms" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/70" />
        </span>
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40"
            style={{ animationDuration: "1.4s", animationDelay: "400ms" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/70" />
        </span>
      </div>
      <span className="text-xs text-muted-foreground animate-pulse">
        Analyzing your finances…
      </span>
    </div>
  );
}

function AssistantAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const config = {
    sm: { container: "w-8 h-8 rounded-xl", icon: "w-4 h-4" },
    md: { container: "w-10 h-10 rounded-2xl", icon: "w-5 h-5" },
    lg: { container: "w-20 h-20 rounded-3xl", icon: "w-10 h-10" },
  };

  return (
    <div
      className={`flex items-center justify-center ${config[size].container}`}
      style={{
        background: "linear-gradient(145deg, var(--primary), color-mix(in oklch, var(--primary), black 25%))",
        boxShadow: "0 4px 14px color-mix(in oklch, var(--primary), transparent 65%)",
      }}
    >
      <Bot className={`${config[size].icon} text-primary-foreground`} />
    </div>
  );
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // ── Filter conversations ──
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Render ──
  return (
    <div className="h-[calc(100svh-3.5rem)] -m-6 md:-m-8">
      <div
        className="flex flex-col md:flex-row h-full overflow-hidden border border-border/60 bg-background/80 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklch, var(--card), white 6%) 0%, color-mix(in oklch, var(--card), var(--background) 16%) 100%)",
        }}
      >
        {/* ═══ SIDEBAR — Conversation History ═══ */}
        <div
          className={`
          flex flex-col border-r border-border/60 shrink-0 min-h-0
          transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? "w-64 md:w-[20rem]" : "w-0"}
        `}
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--card), white 4%) 0%, color-mix(in oklch, var(--card), var(--background) 30%) 100%)",
          }}
        >
          {/* Sidebar Header */}
          <div className="px-4 pt-5 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-foreground tracking-tight">
                  Conversations
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-primary/10 transition-colors"
                onClick={startNewChat}
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                w-full pl-9 pr-3 py-2 text-xs rounded-xl
                bg-background/60 border border-border/50
                placeholder:text-muted-foreground/50
                focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40
                transition-all
              "
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                <p className="text-xs text-muted-foreground/60">
                  Loading chats…
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklch, var(--primary), transparent 85%) 0%, color-mix(in oklch, var(--primary), transparent 95%) 100%)",
                  }}
                >
                  <MessageSquare className="w-6 h-6 text-primary/40" />
                </div>
                <p className="text-xs font-medium text-muted-foreground/70 mb-1">
                  {searchQuery ? "No results found" : "No conversations yet"}
                </p>
                <p className="text-[10px] text-muted-foreground/50">
                  {searchQuery
                    ? "Try a different search"
                    : "Start a new chat to begin"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadConversation(conv._id)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && loadConversation(conv._id)
                  }
                  className={`
                  group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5
                  text-left text-sm cursor-pointer
                  transition-all duration-200 ease-out
                  ${activeConversationId === conv._id
                      ? "bg-primary/10 text-foreground shadow-sm border border-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/80 border border-transparent"
                    }
                `}
                >
                  <div
                    className={`
                    flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors
                    ${activeConversationId === conv._id
                        ? "bg-primary/15"
                        : "bg-muted/50 group-hover:bg-primary/10"
                      }
                  `}
                  >
                    <MessageSquare
                      className={`w-3.5 h-3.5 transition-colors ${activeConversationId === conv._id
                        ? "text-primary"
                        : "text-muted-foreground/50 group-hover:text-primary/70"
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`truncate text-[13px] leading-tight ${activeConversationId === conv._id
                        ? "font-semibold"
                        : "font-medium"
                        }`}
                    >
                      {conv.title}
                    </p>
                    <p className="text-[10px] opacity-50 mt-0.5">
                      {timeAgo(conv.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv._id, e)}
                    className="
                    opacity-0 group-hover:opacity-100 transition-all duration-200
                    p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg
                  "
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="px-4 py-3 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground/40 text-center">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ═══ MAIN CHAT AREA ═══ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          {/* Subtle background pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in oklch, var(--primary), transparent 96%) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />

          {/* Top bar */}
          <div
            className="relative z-10 flex items-center gap-3 px-4 md:px-5 py-3 border-b border-border/50"
            style={{
              background: "color-mix(in oklch, var(--card), transparent 30%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </Button>

            <div className="flex items-center gap-3 min-w-0">
              <AssistantAvatar size="md" />
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">
                  Moniley AI Advisor
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                      style={{ animationDuration: "2s" }}
                    />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Online · Powered by your data
                  </p>
                </div>
              </div>
            </div>

            {activeConversationId && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-xs h-8 gap-1.5 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={startNewChat}
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </Button>
            )}
          </div>

          {/* Messages area */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="relative z-10 flex-1 overflow-y-auto scroll-smooth min-h-0"
          >
            {messages.length === 0 ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto text-center px-4 md:px-6 py-6">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Hi! I&apos;m your Financial Advisor
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                  I have real-time access to your financial data. Ask me
                  anything about your spending, budgets, savings, or get
                  personalized advice.
                </p>

                {/* Prompt cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((sp) => {
                    const Icon = sp.icon;
                    return (
                      <button
                        key={sp.title}
                        onClick={() => sendMessage(sp.prompt)}
                        className="
                        group relative flex items-start gap-3 p-4 rounded-2xl
                        bg-card/80 border border-border/50
                        hover:border-primary/30 hover:shadow-lg
                        transition-all duration-300 text-left overflow-hidden
                      "
                        style={{
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {/* Hover gradient overlay */}
                        <div
                          className={`absolute inset-0 bg-linear-to-br ${sp.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        />
                        <div
                          className={`
                          relative z-10 flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                          bg-linear-to-br ${sp.gradient} transition-transform duration-300
                          group-hover:scale-110
                        `}
                        >
                          <Icon className={`w-4 h-4 ${sp.iconColor}`} />
                        </div>
                        <div className="relative z-10 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {sp.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {sp.prompt}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Messages ── */
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    {/* Assistant avatar */}
                    {msg.role === "assistant" && (
                      <div className="shrink-0 mt-1">
                        <AssistantAvatar size="sm" />
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`
                      max-w-[78%] rounded-2xl px-4 py-3 transition-all
                      ${msg.role === "user"
                          ? "rounded-br-lg text-primary-foreground"
                          : "rounded-bl-lg border border-border/50 shadow-sm"
                        }
                    `}
                      style={
                        msg.role === "user"
                          ? {
                            background:
                              "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary), black 15%) 100%)",
                            boxShadow:
                              "0 4px 12px color-mix(in oklch, var(--primary), transparent 70%)",
                          }
                          : {
                            background:
                              "color-mix(in oklch, var(--card), var(--background) 20%)",
                          }
                      }
                    >
                      {msg.role === "assistant" ? (
                        msg.content ? (
                          <div className="prose-sm">
                            {renderMarkdown(msg.content)}
                          </div>
                        ) : (
                          <TypingIndicator />
                        )
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.role === "user" && (
                      <div className="shrink-0 mt-1">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-xl overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary), black 25%) 100%)",
                          }}
                        >
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full shadow-lg h-9 w-9 border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                onClick={() => scrollToBottom()}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ── Input area ── */}
          <div
            className="relative z-10 border-t border-border/50 px-4 py-4"
            style={{
              background: "color-mix(in oklch, var(--card), transparent 30%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="max-w-4xl mx-auto">
              {/* Input container with glow on focus */}
              <div
                className="
                relative flex items-end gap-2
                p-1.5 rounded-2xl border border-border/60
                bg-background/80 backdrop-blur-sm
                transition-all duration-300
                focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary),transparent_90%)]
              "
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your finances…"
                  disabled={isStreaming}
                  rows={1}
                  className="
                  flex-1 resize-none rounded-xl
                  bg-transparent px-3.5 py-2.5 text-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none
                  disabled:opacity-50 transition-all
                  max-h-40 scrollbar-thin
                "
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="
                  h-10 w-10 rounded-xl shrink-0
                  disabled:opacity-20 disabled:bg-muted
                  transition-all duration-200
                "
                  style={
                    input.trim() && !isStreaming
                      ? {
                        background:
                          "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary), black 15%) 100%)",
                        boxShadow:
                          "0 4px 12px color-mix(in oklch, var(--primary), transparent 60%)",
                      }
                      : undefined
                  }
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <Sparkles className="w-3 h-3 text-primary/30" />
                <p className="text-[10px] text-muted-foreground/50">
                  Moniley AI uses your financial data for personalized advice ·
                  Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
