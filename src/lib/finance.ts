import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type FirestoreError,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type ExpenseStatus = 'Aberta' | 'Paga';
export type ExpenseKind = 'Fixa' | 'Variável' | 'Imposto' | 'Investimento' | 'Tráfego importado';

export interface FinanceExpense {
  id: string;
  description: string;
  category: string;
  kind: ExpenseKind;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: ExpenseStatus;
  isRecurring: boolean;
  paymentMethod: string;
  notes: string;
  source?: 'manual' | 'traffic';
  rawAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ExpenseDraft = Omit<FinanceExpense, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'rawAmount' | 'taxAmount' | 'taxRate'>;

export interface SalesRevenuePoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  platform: string;
  occurredAt?: string;
  grossRevenue?: number;
  platformFeeRate?: number;
  platformFeeAmount?: number;
  netRevenue?: number;
}

export interface TrafficSpendPoint {
  date: string;
  label: string;
  account: string;
  platform: string;
  spend: number;
  campaign: string;
  adSet: string;
  ad: string;
  reach: number;
  impressions: number;
  frequency: number;
  results: number;
  costPerResult: number;
  cpm: number;
  clicks: number;
  cpc: number;
  ctr: number;
  leads: number;
  raw: Record<string, string>;
}


function makeTrafficPoint(point: Pick<TrafficSpendPoint, 'date' | 'label' | 'account' | 'platform' | 'spend'>): TrafficSpendPoint {
  return {
    ...point,
    campaign: '',
    adSet: '',
    ad: '',
    reach: 0,
    impressions: 0,
    frequency: 0,
    results: 0,
    costPerResult: 0,
    cpm: 0,
    clicks: 0,
    cpc: 0,
    ctr: 0,
    leads: 0,
    raw: {},
  };
}

export const TRAFFIC_TAX_RATE = 0.1383;
export const expenseKinds: ExpenseKind[] = ['Fixa', 'Variável', 'Imposto', 'Investimento', 'Tráfego importado'];
export const expenseStatuses: ExpenseStatus[] = ['Aberta', 'Paga'];
export const expenseCategories = ['Equipe', 'Tráfego', 'Ferramentas', 'Impostos', 'Operação', 'Conteúdo', 'Comissões', 'Outros'];

export const defaultRevenue: SalesRevenuePoint[] = [];
export const defaultTrafficSpend: TrafficSpendPoint[] = [];
export const defaultTrafficExpenses: FinanceExpense[] = [];
export const defaultExpenses: FinanceExpense[] = [];

export const emptyExpenseDraft: ExpenseDraft = {
  description: '',
  category: 'Operação',
  kind: 'Variável',
  amount: 0,
  dueDate: new Date().toISOString().slice(0, 10),
  paidDate: '',
  status: 'Aberta',
  isRecurring: false,
  paymentMethod: 'Pix',
  notes: '',
};

export function subscribeExpenses(onChange: (expenses: FinanceExpense[]) => void, onError: (error: FirestoreError) => void) {
  return onSnapshot(
    query(collection(db, 'financePrivateExpenses'), orderBy('dueDate', 'asc')),
    (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as FinanceExpense)),
    onError,
  );
}

export async function createExpense(expense: ExpenseDraft) {
  await addDoc(collection(db, 'financePrivateExpenses'), {
    ...expense,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateExpense(id: string, expense: Partial<ExpenseDraft>) {
  await updateDoc(doc(db, 'financePrivateExpenses', id), {
    ...expense,
    updatedAt: serverTimestamp(),
  });
}

export async function removeExpense(id: string) {
  await deleteDoc(doc(db, 'financePrivateExpenses', id));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}
