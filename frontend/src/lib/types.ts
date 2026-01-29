export interface Wallet {
  id: number;
  user_id: string;
  balance: number;
  created_at: number;
  updated_at: number;
}

export type TxType = 'Reward' | 'Purchase' | 'Transfer' | 'Withdrawal' | 'Deposit';

export interface Transaction {
  id: number;
  from_user_id: string | null;
  to_user_id: string;
  amount: number;
  tx_type: TxType;
  description: string;
  created_at: number;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface OrganismTraits {
  color: ColorRGB;
  size: number;
  speed: number;
  strength: number;
  intelligence: number;
  fertility: number;
}

export interface Organism {
  id: string;
  owner_id: string;
  name: string;
  generation: number;
  traits: OrganismTraits;
  health: number;
  energy: number;
  created_at: number;
  evolved_at: number;
}

export interface Mutation {
  trait_name: string;
  change: number;
  is_beneficial: boolean;
}

export interface EvolutionResult {
  parent_id: string;
  child_id: string;
  mutations: Mutation[];
  generation_increase: number;
  traits_before: OrganismTraits;
  traits_after: OrganismTraits;
}

export interface UserPublic {
  id: number;
  username: string;
  reputation: number;
  level: number;
  bio?: string;
  avatar_url?: string;
  created_at: number;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  likes: number;
  comments: number;
  created_at: number;
  updated_at: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
  expires_in: number;
}
