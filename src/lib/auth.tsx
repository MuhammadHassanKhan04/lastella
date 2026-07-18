import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, name?: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("mock_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // If it's an old mock-id format, wipe it so checkout doesn't fail
        if (parsedUser.id.startsWith("mock-id")) {
          localStorage.removeItem("mock_user");
        } else {
          setUser(parsedUser);
          setSession({ user: parsedUser } as Session);
          setIsAdmin(parsedUser.email === "admin@lastella.com");
        }
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, name: string = "User") => {
    const mockUser: User = {
      id: crypto.randomUUID(),
      email: email,
      user_metadata: { full_name: name },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
    
    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setSession({ user: mockUser } as Session);
    setIsAdmin(email === "admin@lastella.com");
  };

  const signOut = async () => {
    localStorage.removeItem("mock_user");
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{
      user,
      session,
      isAdmin,
      loading,
      signOut,
      signIn
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
