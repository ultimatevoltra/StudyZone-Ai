import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/**
 * StudyZone AI — lightweight local auth (Clerk replacement).
 *
 * This is a self-contained, dependency-free auth provider that replaces
 * Clerk. It stores user profiles in localStorage so the app works
 * immediately with zero API keys. It exposes the same surface ChatApp
 * expects: { user, openAuth, signOut }.
 *
 * To upgrade to a real backend (e.g. Supabase), replace
 * `loadProfile` / `saveProfile` / `signOut` bodies below — the component
 * contract stays the same.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string; // data URL or remote URL
  createdAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signOut: () => void;
}

const STORAGE_KEY = "studyzone_user";

const AuthContext = createContext<AuthContextValue | null>(null);

function loadProfile(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.email) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

function saveProfile(user: AuthUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* ignore quota errors */
  }
}

const AVATAR_COLORS = [
  "#7c3aed",
  "#a78bfa",
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#ec4899",
];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

function avatarFor(name: string): string {
  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="64" fill="${color}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="-apple-system,Segoe UI,sans-serif" font-size="52" font-weight="700" fill="#fff">${initials(name)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(loadProfile());
    setLoading(false);
  }, []);

  const openAuth = useCallback(() => setModalOpen(true), []);
  const closeAuth = useCallback(() => setModalOpen(false), []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setModalOpen(false);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    openAuth,
    closeAuth,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modalOpen && (
        <AuthModal
          onClose={closeAuth}
          onComplete={(u) => {
            saveProfile(u);
            setUser(u);
            setModalOpen(false);
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AuthModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (u: AuthUser) => void;
}) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    const displayName = name.trim() || "Guest";
    const displayEmail = email.trim() || "guest@studyzone.ai";
    const u: AuthUser = {
      id: crypto.randomUUID(),
      email: displayEmail,
      name: displayName,
      avatar: avatarFor(displayName),
      createdAt: Date.now(),
    };
    setStep("confirm");
    setTimeout(() => onComplete(u), 900);
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {step === "form" ? (
          <>
            <div className="auth-modal-logo">
              <img src="./logo.svg" alt="StudyZone AI" width={44} height={44} />
            </div>
            <h2 className="auth-modal-title">Welcome to StudyZone AI</h2>
            <p className="auth-modal-subtitle">
              Enter your details to get started — no password or email
              verification required.
            </p>

            <label className="auth-field">
              <span>Display name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rayhan"
                autoFocus
              />
            </label>

            <label className="auth-field">
              <span>Email (optional)</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </label>

            <button className="btn-primary auth-submit" onClick={submit}>
              Continue
            </button>

            <button
              className="auth-guest"
              onClick={() => {
                setName("");
                setEmail("");
                submit();
              }}
            >
              Continue as guest →
            </button>
          </>
        ) : (
          <div className="auth-confirm">
            <div className="auth-confirm-avatar">
              <img
                src={avatarFor(name.trim() || "Guest")}
                alt="avatar"
                width={72}
                height={72}
              />
            </div>
            <h2 className="auth-modal-title">{name.trim() || "Guest"}</h2>
            <p className="auth-modal-subtitle">
              {email.trim() || "guest@studyzone.ai"}
            </p>
            <div className="auth-confirm-note">
              Setting up your profile…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
