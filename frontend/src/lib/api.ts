import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const l1Api = {
  createWallet: (userId: string) => api.post('/api/l1/wallet/create', { user_id: userId }),
  getBalance: (userId: string) => api.get(`/api/l1/wallet/balance/${userId}`),
  rewardIXI: (userId: string, amount: number, reason: string) =>
    api.post('/api/l1/wallet/reward', { user_id: userId, amount, reason }),
  transferIXI: (fromUserId: string, toUserId: string, amount: number) =>
    api.post('/api/l1/wallet/transfer', { from_user_id: fromUserId, to_user_id: toUserId, amount }),
  getTransactions: (userId: string, limit = 50) =>
    api.get(`/api/l1/wallet/transactions/${userId}?limit=${limit}`),
  getLeaderboard: (limit = 100) => api.get(`/api/l1/leaderboard?limit=${limit}`),
};

export const l3Api = {
  createOrganism: (ownerId: string, name: string) =>
    api.post('/api/l3/organisms/create', { owner_id: ownerId, name }),
  getOrganism: (organismId: string) => api.get(`/api/l3/organisms/${organismId}`),
  getUserOrganisms: (userId: string) => api.get(`/api/l3/organisms/user/${userId}`),
  evolveOrganism: (organismId: string) => api.post(`/api/l3/organisms/${organismId}/evolve`),
  crossover: (parent1Id: string, parent2Id: string, name: string) =>
    api.post('/api/l3/organisms/crossover', { parent1_id: parent1Id, parent2_id: parent2Id, name }),
  getEvolutionHistory: (organismId: string) => api.get(`/api/l3/organisms/${organismId}/history`),
};

export const l4Api = {
  register: (username: string, email: string, password: string) =>
    api.post('/api/l4/auth/register', { username, email, password }),
  login: (email: string, password: string) => api.post('/api/l4/auth/login', { email, password }),
  getCurrentUser: () => api.get('/api/l4/auth/me'),
  getUser: (userId: number) => api.get(`/api/l4/users/${userId}`),
  searchUsers: (query: string) => api.get(`/api/l4/users/search?query=${encodeURIComponent(query)}`),
  createPost: (content: string) => api.post('/api/l4/posts', { content }),
  getPost: (postId: number) => api.get(`/api/l4/posts/${postId}`),
  getFeed: (page = 1, limit = 20) => api.get(`/api/l4/posts/feed?page=${page}&limit=${limit}`),
  likePost: (postId: number) => api.post(`/api/l4/posts/${postId}/like`),
  followUser: (followingId: number) => api.post(`/api/l4/follow/${followingId}`),
  unfollowUser: (followingId: number) => api.delete(`/api/l4/follow/${followingId}`),
  getFollowers: (userId: number) => api.get(`/api/l4/followers/${userId}`),
  getFollowing: (userId: number) => api.get(`/api/l4/following/${userId}`),
};

export async function handleApiResponse<T>(
  promise: Promise<{ data: { success: boolean; data?: T; error?: string } }>
): Promise<T> {
  const response = await promise;
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data;
  }
  throw new Error(response.data.error || 'Unknown error');
}
