import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
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

// Demo users for testing without Supabase
const DEMO_PROFILES: Record<string, Profile> = {
  admin: {
    id: "demo-admin-001",
    full_name: "Demo Admin",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  regional_coordinator: {
    id: "demo-coord-001",
    full_name: "Demo Coordinator",
    role: "regional_coordinator",
    region_id: "a1b2c3d4-0000-0000-0000-000000000001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  camp_manager: {
    id: "demo-manager-001",
    full_name: "Demo Camp Manager",
    role: "camp_manager",
    camp_id: "camp-001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  volunteer: {
    id: "demo-volunteer-001",
    full_name: "Demo Volunteer",
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
        set({ user: DEMO_PROFILES[role] || null, token: "demo-token" });
      },

      signIn: async (email: string, password: string) => {
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
        await supabase.auth.signOut();
        set({ user: null, token: null });
      },

      fetchProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) set({ user: profile as Profile });
      },
    }),
    { name: "displaceos-auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
