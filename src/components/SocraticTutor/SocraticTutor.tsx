import React, { useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TOKEN_KEY = 'lexai_access_token';
const REFRESH_KEY = 'lexai_refresh_token';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  topic: string;
  concepts: string[];
  lessonId: string;
}

/**
 * Try to mint a fresh access token using the stored refresh token. Returns the
 * new access token or null on failure. Used to recover from a 401 mid-session
 * — the access token usually has a short TTL (~15 min) and Root.tsx's periodic
 * refresh runs every 13 min, so a long idle gap can leave us with an expired
 * token by the time the user clicks "Start session."
 */
async function refreshAccessToken(apiUrl: string): Promise<string | null> {
  const refreshToken = typeof localStorage !== 'undefined'
    ? localStorage.getItem(REFRESH_KEY)
    : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.accessToken) return null;
    sessionStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function postTutorChat(
  apiUrl: string,
  token: string | null,
  payload: { topic: string; concepts: string[]; lessonId: string; message: string; history: Message[] },
): Promise<Response | { networkError: true }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    return await fetch(`${apiUrl}/tutor/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    return { networkError: true };
  }
}

async function streamTutorResponse(
  apiUrl: string,
  token: string | null,
  payload: { topic: string; concepts: string[]; lessonId: string; message: string; history: Message[] },
  onChunk: (text: string) => void,
  onError: (msg: string) => void,
  onDone: () => void
) {
  let response = await postTutorChat(apiUrl, token, payload);

  if ('networkError' in response) {
    onError('Could not reach the server. Please check your connection.');
    return;
  }

  // If our access token is stale (Root.tsx refresh hasn't run in time), try
  // to refresh once and retry the request. Avoids dead-ending the session.
  if (response.status === 401) {
    const fresh = await refreshAccessToken(apiUrl);
    if (fresh) {
      const retry = await postTutorChat(apiUrl, fresh, payload);
      if ('networkError' in retry) {
        onError('Could not reach the server. Please check your connection.');
        return;
      }
      response = retry;
    }
  }

  if (!response.ok || !response.body) {
    // Try to extract the backend's JSON error if it sent one. Even if the
    // response is supposed to be SSE, an early failure (auth, validation,
    // 503) returns plain JSON.
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.text();
      // Server-side log path for debugging. The user only sees onError.
      // eslint-disable-next-line no-console
      console.error('[tutor] non-OK response:', response.status, body);
      try {
        const parsed = JSON.parse(body);
        if (parsed.error) detail = parsed.error;
      } catch {
        if (body) detail = body.slice(0, 200);
      }
    } catch {}
    onError(
      response.status === 401
        ? 'Your session expired. Please refresh the page and sign in again.'
        : response.status === 429
          ? 'Too many requests. Please wait a minute and try again.'
          : `Failed to start session: ${detail}`,
    );
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) { onError(parsed.error); return; }
        if (parsed.text) onChunk(parsed.text);
      } catch {}
    }
  }
  onDone();
}

export default function SocraticTutor({ topic, concepts, lessonId }: Props) {
  const { siteConfig } = useDocusaurusContext();
  const apiUrl = (siteConfig.customFields?.apiUrl as string) || '';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [exchangeCount, setExchangeCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  function getToken() {
    return typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(TOKEN_KEY)
      : null;
  }

  async function sendMessage(userMessage: string, displayMessage?: string) {
    const historyForApi = [...messages];
    const displayMsg = displayMessage ?? userMessage;

    if (displayMsg !== 'Begin.') {
      setMessages((prev) => [...prev, { role: 'user', content: displayMsg }]);
    }

    setStreamingText('');
    setIsStreaming(true);
    setError('');

    let accumulated = '';

    await streamTutorResponse(
      apiUrl,
      getToken(),
      { topic, concepts, lessonId, message: userMessage, history: historyForApi },
      (chunk) => {
        accumulated += chunk;
        setStreamingText(accumulated);
      },
      (errMsg) => {
        setError(errMsg);
        setIsStreaming(false);
        setStreamingText('');
      },
      () => {
        setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingText('');
        setIsStreaming(false);
        setExchangeCount((n) => n + 1);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    );
  }

  async function handleOpen() {
    setIsOpen(true);
    setMessages([]);
    setExchangeCount(0);
    setError('');
    await sendMessage('Begin.');
  }

  function handleClose() {
    setIsOpen(false);
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
    setInputValue('');
    setError('');
    setExchangeCount(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue('');
    await sendMessage(text);
  }

  if (!isOpen) {
    return (
      <div className="not-prose my-10">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 dark:border-indigo-800/50 dark:from-indigo-950/30 dark:to-violet-950/30">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-lg font-bold shadow-sm">
              P
            </div>
            <div className="flex-1">
              <p className="m-0 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                Test your understanding
              </p>
              <p className="mt-1 mb-0 text-sm text-slate-600 dark:text-slate-400">
                Prof will ask you questions about <strong>{topic}</strong> — not explain it. You'll be surprised what you don't know until you have to say it.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpen}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            Start session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose my-10">
      <div className="rounded-2xl border border-indigo-200 bg-white shadow-md dark:border-indigo-800/50 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3 dark:border-indigo-800/40 dark:from-indigo-950/40 dark:to-violet-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
              P
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Prof — Socratic Tutor
              </span>
              <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                {topic}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg px-3 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            End session
          </button>
        </div>

        {/* Messages */}
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-4 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-indigo-600 text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {streamingText || (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isStreaming}
              placeholder={isStreaming ? 'Prof is thinking...' : 'Your answer...'}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputValue.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]"
            >
              Send
            </button>
          </form>
          {exchangeCount > 0 && (
            <p className="mt-2 mb-0 text-center text-xs text-slate-400 dark:text-slate-600">
              {exchangeCount} exchange{exchangeCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
