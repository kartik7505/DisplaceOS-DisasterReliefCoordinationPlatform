import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { Profile } from "../types";

interface AuthState {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setDemoUser: (role: Profile["role"]) => void;
}

// Demo users matching backend synthetic entities (store.ts & seed.sql)
const DEMO_PROFILES: Record<string, Profile> = {
  admin: {
    id: "admin-001",
    full_name: "System Administrator",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  regional_coordinator: {
    id: "coord-001",
    full_name: "North Zone Coordinator",
    role: "regional_coordinator",
    region_id: "a1b2c3d4-0000-0000-0000-000000000001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  camp_manager: {
    id: "mgr-001",
    full_name: "Alpha Camp Manager",
    role: "camp_manager",
    camp_id: "camp-001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  volunteer: {
    id: "vol-001",
    full_name: "Anita Roy (Field Volunteer)",
    role: "volunteer",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setDemoUser: (role) => {
        const profile = DEMO_PROFILES[role];
        if (profile) {
          set({ user: profile, token: "demo-token" });
        }
      },

      signIn: async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
          throw new Error("Supabase authentication is not configured in this environment. Please use Demo Quick Login below.");
        }
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          set({ token: data.session?.access_token ?? null });
          await get().fetchProfile();
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        if (isSupabaseConfigured) {
          await supabase.auth.signOut();
        }
        set({ user: null, token: null });
      },

      fetchProfile: async () => {
        if (!isSupabaseConfigured) return;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) set({ user: profile as Profile });
      },
    }),
    { name: "displaceos-auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
