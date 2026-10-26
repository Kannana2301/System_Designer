import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiUrl } from './config';

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

async function readJson(response: Response): Promise<any> {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {
      message:
        raw.length > 300
          ? `${raw.slice(0, 300)}...`
          : raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }
}

async function postAuth(
  path: '/api/auth/login' | '/api/auth/register',
  body: Record<string, string>
): Promise<{ user: User; token: string }> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Unable to reach the API. Check that NEXT_PUBLIC_API_URL points to the deployed backend and that the service is awake.'
    );
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return { user: data.user, token: data.token };
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await postAuth('/api/auth/register', {
            name,
            email,
            password,
          });
          set({ user, token, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await postAuth('/api/auth/login', {
            email,
            password,
          });
          set({ user, token, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      fetchMe: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await fetch(apiUrl('/api/auth/me'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            set({ user: null, token: null });
            return;
          }
          const data = await readJson(res);
          set({ user: data.user });
        } catch {
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
