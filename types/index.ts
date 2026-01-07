export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Poll {
  _id: string;
  productName: string;
  statement: string;
  productImage: string;
  yesButtonText: string;
  noButtonText: string;
  category: Category | string;
  yesVotes: number;
  noVotes: number;
  isTrending?: boolean;
  isTopPoll?: boolean;
  yesPercentage?: number;
  noPercentage?: number;
  totalVotes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoteResponse {
  success: boolean;
  message?: string;
  error?: string;
  poll?: Poll;
}

