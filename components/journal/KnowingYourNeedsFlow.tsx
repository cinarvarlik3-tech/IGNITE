"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  PenLine,
} from "lucide-react";
import { useRouter } from "next/navigation";
import JournalFlowCard from "./JournalFlowCard";
import { useApp } from "@/context/AppContext";
import { generateId } from "@/lib/utils";
import { streamNeedsChat } from "@/lib/openai";
import type { JournalEntryAnalysis, MoodKey } from "@/types";
import { cn } from "@/lib/utils";

type Scope = "moment" | "situation";
type Step = "intro" | "chat" | "analysis" | "saved";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MOOD: MoodKey = "reflective";

const INTRO_BODY = `I'm here to support you in understanding your needs by helping you define those needs then making a plan to meet them.

Do you want to explore your possible needs in this current moment or in a specific situation, circumstance, or relationship?`;

function openingAssistantMessage(scope: Scope): string {
  if (scope === "moment") {
    return `In this current moment

Thank you for clarifying.

To start, let's focus on the emotions you're experiencing right now.

What emotions are you currently feeling?`;
  }
  return `In a situation, circumstance, or relationship

Thank you for clarifying.

To start, let's focus on the emotions you're experiencing regarding this situation.

What emotions are you currently feeling?`;
}

function scopeLabel(scope: Scope): string {
  return scope === "moment"
    ? "In this current moment"
    : "In a situation, circumstance, or relationship";
}

function transcriptForSave(messages: ChatMsg[]): string {
  return messages
    .map((m) => (m.role === "assistant" ? "Coach" : "You") + ": " + m.content)
    .join("\n\n");
}

async function fetchNeedsAnalysis(
  scope: Scope,
  messages: ChatMsg[]
): Promise<JournalEntryAnalysis> {
  const res = await fetch("/api/journal/needs-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    let err = t;
    try {
      const j = JSON.parse(t) as { error?: string };
      if (j.error) err = j.error;
    } catch {
      /* use raw */
    }
    throw new Error(err || `Analysis failed (${res.status})`);
  }
  const data = await res.json();
  return {
    reflection: String(data.reflection ?? ""),
    haiku: String(data.haiku ?? ""),
    feelings: Array.isArray(data.feelings) ? data.feelings : [],
    people: Array.isArray(data.people) ? data.people : [],
    generatedAt: String(data.generatedAt ?? new Date().toISOString()),
  };
}

export default function KnowingYourNeedsFlow() {
  const router = useRouter();
  const {
    saveEntry,
    consumeShards,
    setTab,
    setJournalDraft,
  } = useApp();

  const [step, setStep] = useState<Step>("intro");
  const [scope, setScope] = useState<Scope | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [analysis, setAnalysis] = useState<JournalEntryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** True after this session's analysis was saved to the journal (prevents duplicate save). */
  const [savedToJournal, setSavedToJournal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (step !== "chat") return;
    scrollToBottom();
  }, [messages, streaming, step, scrollToBottom]);

  const runAnalysis = useCallback(
    async (msgs: ChatMsg[]) => {
      if (!scope) return;
      setAnalysisBusy(true);
      setError(null);
      try {
        const a = await fetchNeedsAnalysis(scope, msgs);
        setAnalysis(a);
        setStep("analysis");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        setAnalysisBusy(false);
      }
    },
    [scope]
  );

  const beginChat = () => {
    if (!scope) return;
    setSavedToJournal(false);
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: openingAssistantMessage(scope),
      },
    ]);
    setStep("chat");
    setInput("");
    setTimeout(scrollToBottom, 100);
  };

  const handleIntroFinish = async () => {
    if (!scope) return;
    setSavedToJournal(false);
    const stub: ChatMsg[] = [
      {
        id: generateId(),
        role: "user",
        content: `I'd like to explore my needs: ${scopeLabel(scope)}. I haven't gone through the conversation yet.`,
      },
    ];
    setMessages(stub);
    await runAnalysis(stub);
  };

  const handleGoDeeper = async () => {
    if (!scope || streaming) return;
    const text = input.trim();
    if (!text) return;

    streamAbortRef.current?.abort();
    const ac = new AbortController();
    streamAbortRef.current = ac;

    const userMsg: ChatMsg = {
      id: generateId(),
      role: "user",
      content: text,
    };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setError(null);
    scrollToBottom();

    const asstId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: asstId, role: "assistant", content: "" },
    ]);

    await streamNeedsChat(
      scope,
      [...messages, userMsg].map(({ role, content }) => ({ role, content })),
      (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, content: m.content + token } : m
          )
        );
        scrollToBottom();
      },
      () => {
        setStreaming(false);
        streamAbortRef.current = null;
        scrollToBottom();
      },
      (err) => {
        setStreaming(false);
        streamAbortRef.current = null;
        setError(err.message);
        setMessages((prev) => prev.filter((m) => m.id !== asstId));
      },
      { signal: ac.signal }
    );
  };

  const handleChatFinish = async () => {
    if (!scope || messages.length === 0) return;
    await runAnalysis(messages);
  };

  const handleReflectOnThis = () => {
    if (!analysis || !scope) return;
    const transcript = transcriptForSave(messages);
    setJournalDraft({
      text: `Knowing Your Needs — ${scopeLabel(scope)}\n\n${transcript}\n\n---\n\nReflection:\n${analysis.reflection}\n\nHaiku:\n${analysis.haiku}\n\n`,
    });
    setTab("journal");
    router.push("/");
  };

  const handleFinalSave = async () => {
    if (!analysis || !scope || savedToJournal) return;
    const body = `Knowing Your Needs — ${scopeLabel(scope)}\n\n${transcriptForSave(messages)}`;
    setSaveBusy(true);
    setError(null);
    try {
      consumeShards(2);
      saveEntry(body, MOOD, {
        analysis,
        displayTitle: "Knowing your needs",
      });
      setSavedToJournal(true);
      setStep("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleFlowBack = () => {
    if (step === "intro") {
      router.back();
      return;
    }
    if (step === "chat") {
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;
      setStreaming(false);
      setMessages([]);
      setInput("");
      setError(null);
      setSavedToJournal(false);
      setStep("intro");
      return;
    }
    if (step === "analysis") {
      setAnalysis(null);
      setError(null);
      setSavedToJournal(false);
      setStep("chat");
      return;
    }
    if (step === "saved") {
      setStep("analysis");
    }
  };

  const showIntroActions = scope !== null;
  const canGoDeeper =
    step === "chat" && input.trim().length > 0 && !streaming && !analysisBusy;

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-bg">
      <header className="z-10 shrink-0 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={handleFlowBack}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-teal-light hover:text-teal-dark"
            aria-label={
              step === "intro" ? "Leave this flow" : "Previous step"
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 text-base font-semibold text-text sm:text-lg">
            Knowing Your Needs
          </h1>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <JournalFlowCard
          className="min-h-0 py-2 sm:py-4"
          innerClassName={
            step === "chat" ? "overflow-hidden" : "overflow-y-auto"
          }
        >
          {error && (
            <div
              className="mb-4 shrink-0 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {step === "intro" && (
            <>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-text sm:text-base">
                {INTRO_BODY}
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => setScope("moment")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    scope === "moment"
                      ? "border-teal bg-teal-light text-teal-dark ring-1 ring-teal/20"
                      : "border-border bg-card text-text hover:border-teal/35"
                  )}
                >
                  In this current moment
                </button>
                <button
                  type="button"
                  onClick={() => setScope("situation")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    scope === "situation"
                      ? "border-teal bg-teal-light text-teal-dark ring-1 ring-teal/20"
                      : "border-border bg-card text-text hover:border-teal/35"
                  )}
                >
                  In a situation, circumstance, or relationship
                </button>
              </div>

              {showIntroActions && (
                <>
                  <div className="my-6 border-t border-border" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-stretch">
                    <button
                      type="button"
                      onClick={beginChat}
                      disabled={analysisBusy}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-dark disabled:opacity-50"
                    >
                      <ChevronDown className="h-4 w-4 shrink-0" />
                      Go deeper
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleIntroFinish()}
                      disabled={analysisBusy}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-teal-light hover:text-teal-dark disabled:opacity-50"
                    >
                      {analysisBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                      Finish entry
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {step === "chat" && (
            <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm leading-relaxed sm:text-[15px]",
                      m.role === "assistant"
                        ? "bg-teal-light/70 text-text"
                        : "ml-4 border border-border bg-card text-text"
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 block text-[10px] font-semibold uppercase tracking-wide",
                        m.role === "assistant"
                          ? "text-teal-dark"
                          : "text-text-muted"
                      )}
                    >
                      {m.role === "assistant" ? "Coach" : "You"}
                    </span>
                    <p className="whitespace-pre-line">
                      {m.content}
                      {streaming &&
                        m.role === "assistant" &&
                        m.id === messages[messages.length - 1]?.id &&
                        m.content === "" && (
                          <span className="inline-flex gap-1 pl-1">
                            <span className="animate-pulse">…</span>
                          </span>
                        )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="shrink-0 border-t border-border pt-4">
              <label className="block text-xs font-medium text-text-muted">
                Your message
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (canGoDeeper) void handleGoDeeper();
                  }
                }}
                rows={3}
                disabled={streaming || analysisBusy}
                placeholder="Write what you're feeling…"
                className="mt-1 w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
              />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleGoDeeper()}
                    disabled={!canGoDeeper}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {streaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    )}
                    Go deeper
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleChatFinish()}
                    disabled={streaming || analysisBusy || messages.length < 2}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-teal-light hover:text-teal-dark disabled:opacity-40"
                  >
                    {analysisBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    Finish entry
                  </button>
                </div>
                {messages.length < 2 && (
                  <p className="mt-2 text-center text-[11px] text-text-muted">
                    Share at least one reply before finishing, or use Finish on
                    the first screen.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "analysis" && analysis && (
            <>
              <h2 className="text-lg font-semibold text-text">
                Entry reflection
              </h2>
              <div className="mt-4 rounded-xl border border-border bg-teal-light/25 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-text sm:text-[15px]">
                  {analysis.reflection}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Haiku
                </p>
                <p className="mt-1 whitespace-pre-line text-sm italic text-text-muted">
                  {analysis.haiku}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReflectOnThis}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-teal-light hover:text-teal-dark"
                >
                  <PenLine className="h-4 w-4" />
                  Reflect on this
                </button>
                <button
                  type="button"
                  onClick={() => void handleFinalSave()}
                  disabled={saveBusy || savedToJournal}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-teal-dark disabled:opacity-50"
                >
                  {saveBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedToJournal ? (
                    "Saved"
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Finish entry
                    </>
                  )}
                </button>
              </div>
              {savedToJournal && (
                <p className="mt-3 text-center text-xs text-text-muted">
                  This reflection is already in your journal. Use the back arrow
                  to return to the chat, or open the journal from the home screen.
                </p>
              )}
            </>
          )}

          {step === "saved" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-light">
                <Check className="h-7 w-7 text-teal-dark" strokeWidth={2} />
              </div>
              <p className="text-lg font-medium text-text">
                Saved to your journal.
              </p>
              <Link
                href="/"
                onClick={() => setTab("journal")}
                className="mt-4 inline-block text-sm font-medium text-teal-dark underline-offset-2 hover:underline"
              >
                Open Journal
              </Link>
            </div>
          )}
        </JournalFlowCard>
      </main>
    </div>
  );
}
