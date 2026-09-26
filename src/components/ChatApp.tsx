import { useState, useRef, useEffect, useCallback } from "react";
import { streamChat, translateText, type AIMessage } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import {
  getChats, saveChats, createChat, updateChat, deleteChat,
  clearAllChats, titleFromMessage, type ChatSession, type ChatMessage,
} from "@/lib/storage";

const MODELS = [
  { id: "llama3",  name: "Llama 3",   full: "Meta Llama 3",    desc: "General knowledge & reasoning", color: "#7c3aed", bg: "rgba(124,58,237,0.15)" },
  { id: "mistral", name: "Mistral",   full: "Mistral AI",      desc: "Fast, great at math & code",    color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  { id: "gemma",   name: "Gemma",     full: "Google Gemma",    desc: "Conversational & concise",       color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
];

const SUGGESTIONS_EN = [
  "Explain photosynthesis step by step",
  "Help me solve quadratic equations",
  "Summarize the French Revolution",
  "Write a Python function for sorting",
];
const SUGGESTIONS_BN = [
  "ফটোসিন্থেসিস ধাপে ধাপে ব্যাখ্যা করো",
  "দ্বিঘাত সমীকরণ সমাধান করতে সাহায্য করো",
  "ফরাসি বিপ্লবের সারসংক্ষেপ করো",
  "Python-এ sorting ফাংশন লেখো",
];

export default function ChatApp({ initialPage }: { initialPage?: string }) {
  const { user, openAuth, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(initialPage ?? "chat");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [model, setModel] = useState("llama3");
  const [modelDropdown, setModelDropdown] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const [chats, setChats] = useState<ChatSession[]>(getChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatingMsg, setTranslatingMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const msgs = activeChat?.messages ?? [];
  const selectedModel = MODELS.find((m) => m.id === model)!;

  useEffect(() => { saveChats(chats); }, [chats]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, streaming, streamBuffer]);

  useEffect(() => {
    if (initialPage && initialPage !== "chat") setActivePage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    const close = () => { setModelDropdown(false); setUserMenu(false); };
    if (modelDropdown || userMenu) {
      setTimeout(() => document.addEventListener("click", close), 0);
      return () => document.removeEventListener("click", close);
    }
  }, [modelDropdown, userMenu]);

  const switchLang = useCallback(async (next: "en" | "bn") => {
    if (next === lang) return;
    setLang(next);
    if (msgs.length === 0) return;

    const needsTranslation = msgs.filter(
      (m) => m.role === "assistant" && !m[next === "bn" ? "contentBn" : "contentEn"]
    );
    if (needsTranslation.length === 0) return;

    setTranslating(true);
    setTranslatingMsg(next === "bn" ? "চ্যাট অনুবাদ করা হচ্ছে…" : "Translating chat…");

    const controller = new AbortController();
    abortRef.current = controller;

    for (const msg of needsTranslation) {
      if (controller.signal.aborted) break;
      try {
        const translated = await translateText(msg.content, next, controller.signal);
        const key = next === "bn" ? "contentBn" : "contentEn";
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((m) =>
                    m.id === msg.id ? { ...m, [key]: translated } : m
                  ),
                }
              : chat
          )
        );
      } catch {
        if (controller.signal.aborted) break;
      }
    }
    setTranslating(false);
  }, [lang, msgs, activeChatId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now(),
    };

    let session: ChatSession;
    let currentMsgs: ChatMessage[];

    if (!activeChatId) {
      session = createChat(model);
      session.title = titleFromMessage(text);
      session.messages = [userMsg];
      currentMsgs = [userMsg];
      setChats((prev) => [session, ...prev]);
      setActiveChatId(session.id);
    } else {
      session = { ...activeChat!, messages: [...msgs, userMsg], updatedAt: Date.now() };
      if (session.messages.length === 1) session.title = titleFromMessage(text);
      currentMsgs = session.messages;
      setChats((prev) => updateChat(prev, session));
    }

    setStreaming(true);
    setStreamBuffer("");

    const controller = new AbortController();
    abortRef.current = controller;

    const historyForAI: AIMessage[] = currentMsgs.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    let fullResponse = "";
    try {
      fullResponse = await streamChat(
        historyForAI, model, lang,
        (chunk) => setStreamBuffer((prev) => prev + chunk),
        controller.signal
      );
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      fullResponse = lang === "bn"
        ? "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
        : "Sorry, something went wrong. Please try again.";
    }

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "assistant",
      content: fullResponse, timestamp: Date.now(),
    };

    setChats((prev) => {
      const target = prev.find((c) => c.id === (session.id));
      if (!target) return prev;
      const withAi = { ...target, messages: [...target.messages, aiMsg], updatedAt: Date.now() };
      return updateChat(prev, withAi);
    });

    setStreaming(false);
    setStreamBuffer("");
  }, [input, streaming, activeChatId, activeChat, msgs, model, lang]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
  const handleTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const navTo = (page: string) => { setActivePage(page); setSidebarOpen(false); };
  const newChat = () => { setActiveChatId(null); setActivePage("chat"); setSidebarOpen(false); setTimeout(() => inputRef.current?.focus(), 100); };
  const openChat = (id: string) => { setActiveChatId(id); setActivePage("chat"); setSidebarOpen(false); };
  const delChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChats((prev) => deleteChat(prev, id));
    if (activeChatId === id) setActiveChatId(null);
  };
  const clearAll = () => { clearAllChats(); setChats([]); setActiveChatId(null); setClearConfirm(false); };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setInput((p) => p + (p ? " " : "") + `[📎 ${f.name}]`); inputRef.current?.focus(); }
    e.target.value = "";
  };
  const onVoice = async () => {
    if (isRecording) { mediaRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec; rec.start(); setIsRecording(true);
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setIsRecording(false); };
      setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 30000);
      setInput((p) => p + (p ? " " : "") + "[🎤 Voice message]");
    } catch { setInput((p) => p + (p ? " " : "") + "[Mic access denied]"); }
  };
  const onCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
      setInput((p) => p + (p ? " " : "") + "[📷 Camera input]");
      inputRef.current?.focus();
    } catch { setInput((p) => p + (p ? " " : "") + "[Camera access denied]"); }
  };

  const now = Date.now();
  const todayChats  = chats.filter((c) => now - c.updatedAt < 86400000);
  const weekChats   = chats.filter((c) => now - c.updatedAt >= 86400000 && now - c.updatedAt < 604800000);
  const olderChats  = chats.filter((c) => now - c.updatedAt >= 604800000);

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}

      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <button className="icon-btn" onClick={() => setSidebarOpen(false)}>
            <Ico d="M18 6 6 18M6 6l12 12" />
          </button>
          <button className="icon-btn" onClick={newChat} title={lang === "bn" ? "নতুন চ্যাট" : "New chat"}>
            <Ico d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
          </button>
        </div>

        <div className="sidebar-section">
          {[
            { id: "home",     label: lang === "bn" ? "হোম"           : "Home",           d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" },
            { id: "faq",      label: lang === "bn" ? "প্রশ্নোত্তর"   : "FAQ",            d: "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-7v-2m0-4h.01" },
            { id: "privacy",  label: lang === "bn" ? "গোপনীয়তা নীতি": "Privacy Policy", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
            { id: "about",    label: lang === "bn" ? "আমাদের সম্পর্কে": "About",         d: "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-9v4m0-8h.01" },
            { id: "settings", label: lang === "bn" ? "সেটিংস"        : "Settings",       d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
          ].map((item) => (
            <button key={item.id} className={`nav-btn ${activePage === item.id ? "active" : ""}`} onClick={() => navTo(item.id)}>
              <Ico d={item.d} className="nav-btn-icon" />
              {item.label}
            </button>
          ))}
        </div>

        <hr className="sidebar-divider" />

        <div className="mobile-only sidebar-section" style={{ flexDirection: "column" }}>
          <div className="sidebar-label">{lang === "bn" ? "AI মডেল" : "AI Model"}</div>
          {MODELS.map((m) => (
            <button
              key={m.id}
              className={`nav-btn ${model === m.id ? "active" : ""}`}
              onClick={() => { setModel(m.id); setSidebarOpen(false); }}
            >
              <ModelDot model={m} />
              <span>{m.full}</span>
              {model === m.id && <CheckIco />}
            </button>
          ))}
          <hr className="sidebar-divider" />
        </div>

        <div className="mobile-only sidebar-section" style={{ flexDirection: "column" }}>
          <div className="sidebar-label">{lang === "bn" ? "ভাষা" : "Language"}</div>
          <div style={{ display: "flex", gap: "8px", padding: "0 4px 8px" }}>
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                onClick={() => { switchLang(l); setSidebarOpen(false); }}
                style={{
                  flex: 1, padding: "8px", border: "1px solid",
                  borderColor: lang === l ? "rgba(124,58,237,0.5)" : "var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: lang === l ? "rgba(124,58,237,0.15)" : "none",
                  color: lang === l ? "#c4b5fd" : "var(--text-2)",
                  fontWeight: lang === l ? 600 : 400, fontSize: "13px",
                  cursor: "pointer", fontFamily: "var(--font)",
                }}
              >
                {l === "en" ? "🇬🇧 English" : "🇧🇩 বাংলা"}
              </button>
            ))}
          </div>
          <hr className="sidebar-divider" />
        </div>

        <div className="sidebar-history">
          {chats.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-3)", padding: "8px 6px" }}>
              {lang === "bn" ? "কোনো চ্যাট নেই" : "No chats yet"}
            </p>
          ) : (
            <>
              {todayChats.length > 0 && <ChatGroup label={lang === "bn" ? "আজ" : "Today"} chats={todayChats} activeChatId={activeChatId} onOpen={openChat} onDel={delChat} />}
              {weekChats.length > 0 && <ChatGroup label={lang === "bn" ? "এই সপ্তাহ" : "This week"} chats={weekChats} activeChatId={activeChatId} onOpen={openChat} onDel={delChat} />}
              {olderChats.length > 0 && <ChatGroup label={lang === "bn" ? "পুরনো" : "Older"} chats={olderChats} activeChatId={activeChatId} onOpen={openChat} onDel={delChat} />}
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          {chats.length > 0 && (
            clearConfirm ? (
              <div className="confirm-box">
                <p>{lang === "bn" ? "সব ইতিহাস মুছবেন?" : "Delete all chat history?"}</p>
                <div className="confirm-row">
                  <button className="confirm-yes" onClick={clearAll}>{lang === "bn" ? "হ্যাঁ, মুছুন" : "Yes, clear"}</button>
                  <button className="confirm-no" onClick={() => setClearConfirm(false)}>{lang === "bn" ? "বাতিল" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <button className="clear-all-btn" onClick={() => setClearConfirm(true)}>
                <Ico d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" w={15} />
                {lang === "bn" ? "সব ইতিহাস মুছুন" : "Clear all history"}
              </button>
            )
          )}
          {user && (
            <button className="nav-btn danger" onClick={signOut}>
              <Ico d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" className="nav-btn-icon" />
              {lang === "bn" ? "সাইন আউট" : "Sign out"}
            </button>
          )}
        </div>
      </nav>

      <div className="main">
        <header className="header">
          <div className="header-left">
            <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
              <Ico d="M3 6h18M3 12h18M3 18h18" />
            </button>
            <button className="brand" onClick={newChat}>
              <BrandLogo />
              <span className="brand-name">StudyZone AI</span>
            </button>
          </div>

          <div className="header-center desktop-only" style={{ position: "relative" }}>
            <button className="model-btn" onClick={(e) => { e.stopPropagation(); setModelDropdown(!modelDropdown); setUserMenu(false); }}>
              <ModelDot model={selectedModel} size={18} />
              <span>{selectedModel.full}</span>
              <svg className={`model-chevron ${modelDropdown ? "open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {modelDropdown && (
              <div className="dropdown" style={{ top: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)", minWidth: "240px" }} onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-header">{lang === "bn" ? "মডেল বেছে নিন" : "Choose model"}</div>
                {MODELS.map((m) => (
                  <button key={m.id} className={`dropdown-item ${model === m.id ? "selected" : ""}`} onClick={() => { setModel(m.id); setModelDropdown(false); }}>
                    <ModelDot model={m} size={22} />
                    <div className="dropdown-item-info">
                      <div className="dropdown-item-name">{m.full}</div>
                      <div className="dropdown-item-desc">{m.desc}</div>
                    </div>
                    {model === m.id && <CheckIco />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="header-right">
            <div className="lang-toggle desktop-only">
              <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => switchLang("en")}>EN</button>
              <button className={`lang-btn ${lang === "bn" ? "active" : ""}`} onClick={() => switchLang("bn")}>বাং</button>
            </div>

            {!user && (
              <>
                <button className="btn-ghost desktop-only" onClick={openAuth}>
                  {lang === "bn" ? "লগইন" : "Log in"}
                </button>
                <button className="btn-primary" onClick={openAuth}>
                  {lang === "bn" ? "সাইন আপ" : "Sign up"}
                </button>
              </>
            )}

            {user && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setUserMenu(!userMenu); setModelDropdown(false); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="avatar" style={{ width: 32, height: 32 }} />
                  ) : (
                    <div className="avatar">
                      {(user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
                    </div>
                  )}
                </button>
                {userMenu && (
                  <div className="dropdown user-menu" style={{ top: "calc(100% + 10px)", right: 0 }} onClick={(e) => e.stopPropagation()}>
                    <div className="user-menu-header">
                      <div className="name">{user?.name ?? "User"}</div>
                      <div className="email">{user?.email}</div>
                    </div>
                    <button className="dropdown-item" onClick={() => { navTo("settings"); setUserMenu(false); }}>
                      <Ico d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" w={16} />
                      {lang === "bn" ? "সেটিংস" : "Settings"}
                    </button>
                    <button className="dropdown-item" style={{ color: "#f87171" }} onClick={signOut}>
                      <Ico d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" w={16} />
                      {lang === "bn" ? "সাইন আউট" : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {activePage !== "chat" ? (
          <SubPageView page={activePage} lang={lang} />
        ) : (
          <>
            <div className="chat-scroll">
              {msgs.length === 0 ? (
                <WelcomeScreen lang={lang} onSuggest={(s) => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }} />
              ) : (
                <div className="chat-inner">
                  {msgs.map((msg) => (
                    <MessageRow key={msg.id} msg={msg} lang={lang} user={user} modelId={activeChat?.model ?? model} />
                  ))}
                  {streaming && (
                    <div className="msg-row">
                      <div className="msg-avatar ai-av"><AiIcon /></div>
                      <div className="msg-body">
                        <div className="msg-bubble ai">
                          {streamBuffer ? (
                            <div className="ai-text"><FormattedText text={streamBuffer} /></div>
                          ) : (
                            <div className="typing">
                              <div className="typing-dot" />
                              <div className="typing-dot" />
                              <div className="typing-dot" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {translating && (
              <div className="translating-bar">
                <span className="spin">⟳</span>
                {translatingMsg}
              </div>
            )}

            <div className="input-area">
              <div className="input-wrap">
                <div className="input-box">
                  <div className="input-attach-group">
                    <input type="file" ref={fileInputRef} onChange={onFile} style={{ display: "none" }} />
                    <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title={lang === "bn" ? "ফাইল" : "Attach file"}>
                      <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
                    </button>
                    <button className={`icon-btn ${isRecording ? "recording" : ""}`} onClick={onVoice} title={lang === "bn" ? "ভয়েস" : "Voice"}>
                      <Ico d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </button>
                    <button className="icon-btn" onClick={onCamera} title={lang === "bn" ? "ক্যামেরা" : "Camera"}>
                      <Ico d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </button>
                  </div>

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleTextarea}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={lang === "bn" ? "StudyZone AI-কে কিছু জিজ্ঞেস করুন…" : "Message StudyZone AI…"}
                    className="input-textarea"
                    disabled={streaming}
                  />

                  <button className="send-btn" onClick={handleSend} disabled={!input.trim() || streaming}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                </div>
                <div className="input-footer">
                  {lang === "bn"
                    ? "Enter = পাঠান · Shift+Enter = নতুন লাইন · StudyZone AI ভুল করতে পারে।"
                    : "Enter to send · Shift+Enter for new line · StudyZone AI can make mistakes."}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ lang, onSuggest }: { lang: "en" | "bn"; onSuggest: (s: string) => void }) {
  const list = lang === "bn" ? SUGGESTIONS_BN : SUGGESTIONS_EN;
  return (
    <div className="welcome">
      <div className="welcome-logo-wrap">
        <BrandLogo size={42} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <h1 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.3, color: "#e8e8f8", textAlign: "center" }}>
          {lang === "bn"
            ? <>আজ আমি কীভাবে <span style={{ background: "linear-gradient(120deg,#c4b5fd,#67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>সাহায্য</span> করব?</>
            : <>How can I <span style={{ background: "linear-gradient(120deg,#c4b5fd,#67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>help you</span> today?</>}
        </h1>
        <p style={{ fontSize: 15, color: "#8a8ab2", lineHeight: 1.65, textAlign: "center", maxWidth: 380 }}>
          {lang === "bn"
            ? "বিজ্ঞান, গণিত, ইতিহাস, কোড — যেকোনো বিষয়ে প্রশ্ন করুন।"
            : "Ask me anything — science, math, history, code, languages, and more."}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, maxWidth: 560, width: "100%" }}>
        {list.map((s, i) => (
          <button key={i} className="suggestion"
            style={{ padding: "15px 17px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left", fontSize: 13, color: "#9090b8", lineHeight: 1.55, fontFamily: "var(--font)", transition: "all 0.22s" }}
            onClick={() => onSuggest(s)}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

function MessageRow({ msg, lang, user, modelId }: {
  msg: ChatMessage; lang: "en" | "bn";
  user: any; modelId: string;
}) {
  const content = msg.role === "assistant" && lang === "bn" && msg.contentBn ? msg.contentBn : msg.content;

  if (msg.role === "user") {
    const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();
    return (
      <div className="msg-row user">
        {user ? (
          user.avatar
            ? <img src={user.avatar} alt="" className="msg-avatar user-av" style={{ objectFit: "cover" }} />
            : <div className="msg-avatar user-av">{initial}</div>
        ) : (
          <div className="msg-avatar user-av">U</div>
        )}
        <div className="msg-body">
          <div className="msg-bubble user">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-row">
      <div className="msg-avatar ai-av"><AiIcon /></div>
      <div className="msg-body" style={{ maxWidth: "100%" }}>
        <div className="msg-bubble ai">
          <div className="ai-text"><FormattedText text={content} /></div>
        </div>
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { out.push(<br key={i} />); i++; continue; }
    if (line.startsWith("### ")) { out.push(<h3 key={i}>{inline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("## "))  { out.push(<h2 key={i}>{inline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("# "))   { out.push(<h1 key={i}>{inline(line.slice(2))}</h1>); i++; continue; }
    if (line.startsWith("---") && line.match(/^-+$/)) { out.push(<hr key={i} />); i++; continue; }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim(); const clines: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { clines.push(lines[i]); i++; }
      out.push(<pre key={i}><code className={lang}>{clines.join("\n")}</code></pre>); i++; continue;
    }
    if (line.startsWith("> ")) { out.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>); i++; continue; }
    if (line.match(/^(\*|-|\•) /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^(\*|-|\•) /)) { items.push(lines[i].slice(2)); i++; }
      out.push(<ul key={i}>{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>); continue;
    }
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, "")); i++; }
      out.push(<ol key={i}>{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>); continue;
    }
    out.push(<p key={i}>{inline(line)}</p>); i++;
  }
  return <>{out}</>;
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rem = text; let k = 0;
  while (rem) {
    const b2 = rem.indexOf("**"), b1 = rem.indexOf("*"), bt = rem.indexOf("`");
    const candidates = [
      b2 !== -1 ? { idx: b2, type: "bold" } : null,
      b1 !== -1 && (b2 === -1 || b1 !== b2) ? { idx: b1, type: "italic" } : null,
      bt !== -1 ? { idx: bt, type: "code" } : null,
    ].filter(Boolean) as { idx: number; type: string }[];
    if (!candidates.length) { parts.push(rem); break; }
    candidates.sort((a, b) => a.idx - b.idx);
    const first = candidates[0];
    if (first.idx > 0) parts.push(rem.slice(0, first.idx));
    rem = rem.slice(first.idx);
    if (first.type === "bold") {
      const end = rem.indexOf("**", 2);
      if (end === -1) { parts.push(rem); break; }
      parts.push(<strong key={k++}>{rem.slice(2, end)}</strong>); rem = rem.slice(end + 2);
    } else if (first.type === "italic") {
      const end = rem.indexOf("*", 1);
      if (end === -1) { parts.push(rem); break; }
      parts.push(<em key={k++}>{rem.slice(1, end)}</em>); rem = rem.slice(end + 1);
    } else {
      const end = rem.indexOf("`", 1);
      if (end === -1) { parts.push(rem); break; }
      parts.push(<code key={k++}>{rem.slice(1, end)}</code>); rem = rem.slice(end + 1);
    }
  }
  return <>{parts}</>;
}

function ChatGroup({ label, chats, activeChatId, onOpen, onDel }: {
  label: string; chats: ChatSession[]; activeChatId: string | null;
  onOpen: (id: string) => void; onDel: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <>
      <div className="chat-group-label">{label}</div>
      {chats.map((c) => (
        <button key={c.id} className={`chat-item ${activeChatId === c.id ? "active" : ""}`} onClick={() => onOpen(c.id)}>
          <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" w={14} />
          <span className="chat-item-text">{c.title}</span>
          <button className="chat-del" onClick={(e) => onDel(e, c.id)} title="Delete">
            <Ico d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" w={13} />
          </button>
        </button>
      ))}
    </>
  );
}

function SubPageView({ page, lang }: { page: string; lang: "en" | "bn" }) {
  const content: Record<string, { en: React.ReactNode; bn: React.ReactNode }> = {
    home: {
      en: <><h1>Welcome to StudyZone AI</h1><p className="sub-lead">Your intelligent learning companion powered by open-source AI</p>
        <h2>What can StudyZone AI do?</h2>
        {[["📚 Answer Any Question","From quantum physics to history — ask anything and get detailed answers."],["🧠 Deep Explanations","Complex topics broken into digestible steps with examples."],["💻 Code Help","Write, debug, and understand code in any programming language."],["🌐 Bangla & English","Toggle between Bangla and English. The AI translates your entire chat."],["🎤 Voice & Camera","Speak your question or point your camera at a problem."],["📁 File Analysis","Upload documents, PDFs, and images for analysis."]].map(([t,d])=><div className="fcard" key={t}><h3>{t}</h3><p>{d}</p></div>)}
        <h2>AI Models</h2>
        {[["🦙 Meta Llama 3","Best for general knowledge, writing, and reasoning."],["🌪 Mistral AI","Fast and strong at math, coding, and multilingual tasks."],["💎 Google Gemma","Lightweight, great for concise educational responses."]].map(([t,d])=><div className="fcard" key={t}><h3>{t}</h3><p>{d}</p></div>)}</>,
      bn: <><h1>StudyZone AI-তে স্বাগতম</h1><p className="sub-lead">ওপেন-সোর্স AI দ্বারা চালিত আপনার বুদ্ধিমান শেখার সঙ্গী</p>
        <h2>StudyZone AI কী করতে পারে?</h2>
        {[["📚 যেকোনো প্রশ্নের উত্তর","কোয়ান্টাম পদার্থবিজ্ঞান থেকে ইতিহাস — যেকোনো কিছু জিজ্ঞেস করুন।"],["🧠 গভীর ব্যাখ্যা","জটিল বিষয়গুলো সহজ ধাপে ভেঙে বোঝানো হয়।"],["💻 কোড সহায়তা","যেকোনো ভাষায় কোড লিখতে, ডিবাগ করতে সাহায্য।"],["🌐 বাংলা ও ইংরেজি","ভাষা বদলান — পুরো চ্যাট অনুবাদ হয়ে যাবে।"]].map(([t,d])=><div className="fcard" key={t}><h3>{t}</h3><p>{d}</p></div>)}</>,
    },
    faq: {
      en: <><h1>Frequently Asked Questions</h1><p className="sub-lead">Everything you need to know about StudyZone AI</p>
        {[["What is StudyZone AI?","An intelligent learning platform powered by open-source AI models (Llama 3, Mistral, Gemma) that helps students with any academic subject."],["Is it free?","Yes! No API key, no subscription needed. Just open and start learning."],["How does the Bangla toggle work?","Click বাং to switch to Bangla. The AI will respond in Bangla, and your previous messages will be translated automatically."],["Can I upload files?","Yes — click the file icon in the input area to attach documents or images."],["How do I delete chats?","Click the trash icon next to any chat, or use 'Clear all history' at the bottom of the sidebar."],["Which model should I choose?","Llama 3 for general topics, Mistral for math/code, Gemma for quick concise answers."]].map(([q,a])=><div className="fcard" key={q}><h3>{q}</h3><p>{a}</p></div>)}</>,
      bn: <><h1>সচরাচর জিজ্ঞাসিত প্রশ্ন</h1><p className="sub-lead">StudyZone AI সম্পর্কে আপনার জানার সব কিছু</p>
        {[["StudyZone AI কী?","এটি একটি বুদ্ধিমান শেখার প্ল্যাটফর্ম যা ওপেন-সোর্স AI মডেল দ্বারা চালিত।"],["এটি কি বিনামূল্যে?","হ্যাঁ! কোনো API কী বা সাবস্ক্রিপশন দরকার নেই।"],["বাংলা টগল কীভাবে কাজ করে?","বাং বোতাম চাপুন। AI বাংলায় উত্তর দেবে এবং আগের সব বার্তা অনুবাদ হবে।"]].map(([q,a])=><div className="fcard" key={q}><h3>{q}</h3><p>{a}</p></div>)}</>,
    },
    privacy: {
      en: <><h1>Privacy Policy</h1><p className="sub-lead">Last updated: June 2025</p><p>StudyZone AI is committed to protecting your privacy. Chat history is stored only in your browser's local storage — not on our servers. We use open-source AI models for generating responses.</p><h2>Data We Collect</h2><ul><li>Account info (email, name)</li><li>Chat messages processed in real-time to generate responses</li><li>Anonymous usage statistics to improve the service</li></ul><h2>Your Rights</h2><p>You can delete your chat history anytime from the sidebar. To delete your account, contact support@studyzone.ai</p></>,
      bn: <><h1>গোপনীয়তা নীতি</h1><p className="sub-lead">সর্বশেষ আপডেট: জুন ২০২৫</p><p>StudyZone AI আপনার গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। চ্যাট ইতিহাস শুধুমাত্র আপনার ব্রাউজারে সংরক্ষিত হয়।</p><h2>আমরা কী সংগ্রহ করি</h2><ul><li>অ্যাকাউন্ট তথ্য</li><li>রিয়েল-টাইমে প্রক্রিয়াকৃত চ্যাট বার্তা</li></ul></>,
    },
    about: {
      en: <><h1>About StudyZone AI</h1><p className="sub-lead">Making world-class education accessible to everyone</p><p>StudyZone AI was built to democratize education — giving every student access to an intelligent tutor available 24/7, powered entirely by free, open-source AI models. No subscription. No API key. Just learning.</p><h2>Our Values</h2>{[["🆓 Free Forever","No paywalls, no API keys required. Education should be free."],["🔓 Open Source AI","Built on Llama 3, Mistral, and Gemma — transparent, community-driven models."],["🌍 Multilingual","Full Bangla and English support. More languages coming soon."],["🔒 Privacy First","Your chats stay in your browser. We don't sell your data."]].map(([t,d])=><div className="fcard" key={t}><h3>{t}</h3><p>{d}</p></div>)}<h2>Contact</h2><p>hello@studyzone.ai</p></>,
      bn: <><h1>StudyZone AI সম্পর্কে</h1><p className="sub-lead">সবার জন্য বিশ্বমানের শিক্ষা সুলভ করা</p><p>StudyZone AI শিক্ষার গণতন্ত্রীকরণের লক্ষ্যে তৈরি — বিনামূল্যে, ওপেন-সোর্স AI মডেল দ্বারা চালিত।</p>{[["🆓 সম্পূর্ণ বিনামূল্যে","কোনো পেওয়াল বা API কী নেই।"],["🌍 বহুভাষিক","বাংলা ও ইংরেজি সম্পূর্ণ সমর্থিত।"]].map(([t,d])=><div className="fcard" key={t}><h3>{t}</h3><p>{d}</p></div>)}<h2>যোগাযোগ</h2><p>hello@studyzone.ai</p></>,
    },
    settings: {
      en: <><h1>Settings</h1><p className="sub-lead">Customize your experience</p><h2>AI Model</h2><p>Use the model selector in the header (or sidebar on mobile) to switch between Meta Llama 3, Mistral AI, and Google Gemma.</p><h2>Language</h2><p>Use the EN / বাং toggle to switch languages. The AI will respond in your chosen language, and clicking the toggle also translates your entire previous chat history.</p><h2>Chat History</h2><p>All chats are stored locally in your browser. Use "Clear all history" in the sidebar to delete everything. Individual chats can be deleted with the trash icon.</p><h2>Account</h2><p>Sign in to keep your preferences. Your chat history is local to your browser and is not synced across devices.</p></>,
      bn: <><h1>সেটিংস</h1><p className="sub-lead">আপনার অভিজ্ঞতা কাস্টমাইজ করুন</p><h2>AI মডেল</h2><p>হেডারের (মোবাইলে সাইডবারে) মডেল সিলেক্টর ব্যবহার করুন।</p><h2>ভাষা</h2><p>EN / বাং টগল ব্যবহার করুন। AI আপনার পছন্দের ভাষায় উত্তর দেবে এবং আগের চ্যাট অনুবাদ হবে।</p><h2>চ্যাট ইতিহাস</h2><p>সব চ্যাট আপনার ব্রাউজারে স্থানীয়ভাবে সংরক্ষিত। সাইডবারে "সব ইতিহাস মুছুন" ব্যবহার করুন।</p></>,
    },
  };
  const pg = content[page] ?? content.home;
  return (
    <div className="subpage-wrap">
      <div className="subpage-inner">{pg[lang]}</div>
    </div>
  );
}

function Ico({ d, w = 18, className = "" }: { d: string; w?: number; className?: string }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function CheckIco() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ModelDot({ model, size = 20 }: { model: (typeof MODELS)[0]; size?: number }) {
  return (
    <span
      className="model-badge"
      style={{ width: size, height: size, background: model.bg, color: model.color, border: `1px solid ${model.color}40`, fontSize: size * 0.45 }}
    >
      {model.name[0]}
    </span>
  );
}

function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 10C20 10 17 12.5 16.5 16C14 16.5 12 18.5 12 21C12 23.5 13.5 25.5 15.5 26.5C15.5 29 17.5 31 20 31H24M24 10C28 10 31 12.5 31.5 16C34 16.5 36 18.5 36 21C36 23.5 34.5 25.5 32.5 26.5C32.5 29 30.5 31 28 31H24"
        stroke="url(#bl)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="24" y1="10" x2="24" y2="31" stroke="#7c3aed" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <circle cx="18" cy="20" r="1.8" fill="#7c3aed" />
      <circle cx="30" cy="20" r="1.8" fill="#06b6d4" />
      <circle cx="24" cy="14" r="1.2" fill="#a78bfa" opacity="0.8" />
      <path d="M16 33 L24 31 L32 33 L24 35 Z" fill="rgba(124,58,237,0.3)" stroke="#7c3aed" strokeWidth="1" />
      <defs>
        <linearGradient id="bl" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
      <path d="M24 10C20 10 17 12.5 16.5 16C14 16.5 12 18.5 12 21C12 23.5 13.5 25.5 15.5 26.5C15.5 29 17.5 31 20 31H24M24 10C28 10 31 12.5 31.5 16C34 16.5 36 18.5 36 21C36 23.5 34.5 25.5 32.5 26.5C32.5 29 30.5 31 28 31H24"
        stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="20" r="2" fill="#7c3aed" />
      <circle cx="30" cy="20" r="2" fill="#06b6d4" />
    </svg>
  );
}
