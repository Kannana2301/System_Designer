import { apiUrl } from './config';
import { useAuth } from './auth';

interface ApiErrorBody {
  message?: string;
  errors?: unknown;
}

async function parseResponseBody(response: Response): Promise<any> {
  const raw = await response.text();

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    // Render/Netlify can return an HTML error page (502/504, proxy errors).
    // Never let response.json() throw an opaque "Unexpected token '<'" error.
    return {
      message:
        raw.length > 300
          ? `${raw.slice(0, 300)}...`
          : raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuth.getState().token;

  let response: Response;

  try {
    response = await fetch(apiUrl(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Unable to reach the API. Check that NEXT_PUBLIC_API_URL points to the deployed backend and that the service is awake.'
    );
  }

  const data: ApiErrorBody = await parseResponseBody(response);

  if (response.status === 401) {
    // The stored token is missing/expired. Clearing it lets the route guards
    // redirect to /login instead of showing a misleading "not found" page.
    useAuth.getState().logout();
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export const projectApi = {
  create: (data: { name: string; description: string; type?: string; experienceLevel?: string }) =>
    fetchWithAuth<{ success: boolean; project: any }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () =>
    fetchWithAuth<{ success: boolean; projects: any[] }>('/api/projects'),

  getOne: (id: string) =>
    fetchWithAuth<{ success: boolean; project: any }>(`/api/projects/${id}`),

  update: (id: string, data: Partial<{ name: string; description: string; type: string; experienceLevel: string; status: string }>) =>
    fetchWithAuth<{ success: boolean; project: any }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
};

export const analysisApi = {
  generate: (projectId: string) =>
    fetchWithAuth<{ success: boolean; analysis: any }>(`/api/projects/${projectId}/analysis/generate`, {
      method: 'POST',
    }),

  get: (projectId: string) =>
    fetchWithAuth<{ success: boolean; analysis: any }>(`/api/projects/${projectId}/analysis`),
};

export const techStackApi = {
  generate: (projectId: string) =>
    fetchWithAuth<{ success: boolean; techStack: any }>(`/api/projects/${projectId}/tech-stack/generate`, {
      method: 'POST',
    }),

  get: (projectId: string) =>
    fetchWithAuth<{ success: boolean; techStack: any }>(`/api/projects/${projectId}/tech-stack`),

  update: (projectId: string, data: { frontend?: any[]; backend?: any[]; database?: any[]; authentication?: any[]; otherServices?: any[] }) =>
    fetchWithAuth<{ success: boolean; techStack: any }>(`/api/projects/${projectId}/tech-stack`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    fetchWithAuth<{ success: boolean; token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchWithAuth<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () =>
    fetchWithAuth<{ success: boolean; user: any }>('/api/auth/me'),
};

export const roadmapApi = {
  generate: (projectId: string) =>
    fetchWithAuth<{ success: boolean; roadmap: any }>(`/api/projects/${projectId}/roadmap/generate`, {
      method: 'POST',
    }),

  get: (projectId: string) =>
    fetchWithAuth<{ success: boolean; roadmap: any }>(`/api/projects/${projectId}/roadmap`),

  updateTaskStatus: (projectId: string, phaseIndex: number, taskIndex: number, status: string) =>
    fetchWithAuth<{ success: boolean; roadmap: any }>(`/api/projects/${projectId}/roadmap/tasks/${phaseIndex}/${taskIndex}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const architectureApi = {
  generate: (projectId: string) =>
    fetchWithAuth<{ success: boolean; architecture: any }>(`/api/projects/${projectId}/architecture/generate`, {
      method: 'POST',
    }),

  get: (projectId: string) =>
    fetchWithAuth<{ success: boolean; architecture: any }>(`/api/projects/${projectId}/architecture`),

  update: (projectId: string, data: { nodes?: any[]; edges?: any[] }) =>
    fetchWithAuth<{ success: boolean; architecture: any }>(`/api/projects/${projectId}/architecture`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const chatApi = {
  sendMessage: (projectId: string, message: string) =>
    fetchWithAuth<{ success: boolean; data: { message: { role: string; content: string } } }>(`/api/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getHistory: (projectId: string) =>
    fetchWithAuth<{ success: boolean; messages: any[] }>(`/api/projects/${projectId}/chat`),

  clearHistory: (projectId: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/api/projects/${projectId}/chat`, {
      method: 'DELETE',
    }),
};

export const healthApi = {
  check: () =>
    fetch(apiUrl('/api/health')).then(async (res) => {
      const data = await parseResponseBody(res);
      return { ok: res.ok, status: res.status, ...data };
    }),
};
