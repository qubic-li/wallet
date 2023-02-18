export interface AuthResponse {
  success?: boolean;
  token?: string | null;
  refreshToken?: string | null;
  privileges?: Array<string> | null;
}

export interface CurrentTickResponse {
  tick: number;
  dateTime: Date;
}


export interface SubmitTransactionResponse {
  id: string;
  dateTime: Date;
}

export interface SubmitTransactionRequest {
  SignedTransaction: string
}

export interface Transaction {
  id: string;
  sourceId: string;
  destId: string;
  amount: number;
  tick: number;
  status: string;
  created: Date;
  statusUpdate: Date;
}

export interface BalanceResponse {
  publicId: string;
  currentEstimatedAmount: number;
  epochBaseAmount: number;
  baseDate: Date;
  transactions: Transaction[]
}