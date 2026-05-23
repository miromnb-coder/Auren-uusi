import { supabase } from './supabase';

export type AurenCreditPlanName = 'free' | 'plus' | string;

export type AurenCreditPlan = {
  plan: AurenCreditPlanName;
  displayName: string;
  dailyAllowance: number;
  maxBalance: number;
  monthlySoftCap: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AurenCreditAccount = {
  id: string;
  userId: string;
  plan: AurenCreditPlanName;
  balance: number;
  dailyAllowance: number;
  maxBalance: number;
  usedToday: number;
  usedThisWeek: number;
  usedThisMonth: number;
  currentDay: string;
  currentWeekStart: string;
  currentMonth: string;
  lastRefillAt: string;
  nextRefillAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AurenCreditEventType =
  | 'initial_grant'
  | 'daily_refill'
  | 'spend'
  | 'refund'
  | 'adjustment'
  | 'upgrade_bonus';

export type AurenCreditEvent = {
  id: string;
  userId: string;
  accountId: string | null;
  amount: number;
  balanceAfter: number | null;
  eventType: AurenCreditEventType;
  reason: string;
  conversationId: string | null;
  projectId: string | null;
  createdAt: string;
};

export type AurenCreditSummary = {
  account: AurenCreditAccount;
  plan: AurenCreditPlan | null;
  available: number;
  dailyAllowance: number;
  maxBalance: number;
  usedToday: number;
  usedThisWeek: number;
  usedThisMonth: number;
  todayProgress: number;
  monthProgress: number | null;
  nextRefillAt: string;
  nextRefillLabel: string;
  planLabel: string;
};

export type AurenCreditSpendReason = 'chat_message' | 'image_message' | 'project_message' | string;

export type AurenCreditSpendInput = {
  amount: number;
  reason: AurenCreditSpendReason;
  conversationId?: string | null;
  projectId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

export type AurenCreditSpendResult = {
  ok: boolean;
  errorCode: string | null;
  cost: number;
  balance: number;
  dailyAllowance: number;
  maxBalance: number;
  usedToday: number;
  usedThisWeek: number;
  usedThisMonth: number;
  nextRefillAt: string;
  nextRefillLabel: string;
};

export class AurenCreditsError extends Error {
  code: string;
  result: AurenCreditSpendResult | null;

  constructor(message: string, code: string, result: AurenCreditSpendResult | null = null) {
    super(message);
    this.name = 'AurenCreditsError';
    this.code = code;
    this.result = result;
  }
}

type CreditPlanRow = {
  plan: string;
  display_name: string;
  daily_allowance: number;
  max_balance: number;
  monthly_soft_cap: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CreditAccountRow = {
  id: string;
  user_id: string;
  plan: string;
  balance: number;
  daily_allowance: number;
  max_balance: number;
  used_today: number;
  used_this_week: number;
  used_this_month: number;
  current_day: string;
  current_week_start: string;
  current_month: string;
  last_refill_at: string;
  next_refill_at: string;
  created_at: string;
  updated_at: string;
};

type CreditEventRow = {
  id: string;
  user_id: string;
  account_id: string | null;
  amount: number;
  balance_after: number | null;
  event_type: AurenCreditEventType;
  reason: string;
  conversation_id: string | null;
  project_id: string | null;
  created_at: string;
};

type CreditSpendRpcRow = {
  ok: boolean;
  error_code: string | null;
  cost: number;
  balance: number;
  daily_allowance: number;
  max_balance: number;
  used_today: number;
  used_this_week: number;
  used_this_month: number;
  next_refill_at: string;
};

const DEFAULT_PLAN: AurenCreditPlan = {
  plan: 'free',
  displayName: 'Free',
  dailyAllowance: 40,
  maxBalance: 300,
  monthlySoftCap: 500,
  isActive: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function mapCreditPlan(row: CreditPlanRow): AurenCreditPlan {
  return {
    plan: row.plan,
    displayName: row.display_name,
    dailyAllowance: row.daily_allowance,
    maxBalance: row.max_balance,
    monthlySoftCap: row.monthly_soft_cap,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreditAccount(row: CreditAccountRow): AurenCreditAccount {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    balance: row.balance,
    dailyAllowance: row.daily_allowance,
    maxBalance: row.max_balance,
    usedToday: row.used_today,
    usedThisWeek: row.used_this_week,
    usedThisMonth: row.used_this_month,
    currentDay: row.current_day,
    currentWeekStart: row.current_week_start,
    currentMonth: row.current_month,
    lastRefillAt: row.last_refill_at,
    nextRefillAt: row.next_refill_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreditEvent(row: CreditEventRow): AurenCreditEvent {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    amount: row.amount,
    balanceAfter: row.balance_after,
    eventType: row.event_type,
    reason: row.reason,
    conversationId: row.conversation_id,
    projectId: row.project_id,
    createdAt: row.created_at,
  };
}

function createRefillLabel(nextRefillAt: string) {
  const nextRefillTime = new Date(nextRefillAt).getTime();

  if (!Number.isFinite(nextRefillTime)) {
    return 'Daily refill soon';
  }

  const diffMs = nextRefillTime - Date.now();

  if (diffMs <= 0) {
    return 'Daily refill ready';
  }

  const totalMinutes = Math.max(1, Math.ceil(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.ceil(hours / 24);
    return `Daily refill in ${days}d`;
  }

  if (hours > 0 && minutes > 0) {
    return `Daily refill in ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `Daily refill in ${hours}h`;
  }

  return `Daily refill in ${minutes}m`;
}

function createCreditSummary(account: AurenCreditAccount, plan: AurenCreditPlan | null): AurenCreditSummary {
  const resolvedPlan = plan ?? DEFAULT_PLAN;
  const monthlySoftCap = resolvedPlan.monthlySoftCap;

  return {
    account,
    plan,
    available: account.balance,
    dailyAllowance: account.dailyAllowance,
    maxBalance: account.maxBalance,
    usedToday: account.usedToday,
    usedThisWeek: account.usedThisWeek,
    usedThisMonth: account.usedThisMonth,
    todayProgress: account.dailyAllowance > 0 ? clamp01(account.usedToday / account.dailyAllowance) : 0,
    monthProgress: monthlySoftCap && monthlySoftCap > 0 ? clamp01(account.usedThisMonth / monthlySoftCap) : null,
    nextRefillAt: account.nextRefillAt,
    nextRefillLabel: createRefillLabel(account.nextRefillAt),
    planLabel: resolvedPlan.displayName,
  };
}

function mapSpendResult(row: CreditSpendRpcRow): AurenCreditSpendResult {
  return {
    ok: row.ok,
    errorCode: row.error_code,
    cost: row.cost,
    balance: row.balance,
    dailyAllowance: row.daily_allowance,
    maxBalance: row.max_balance,
    usedToday: row.used_today,
    usedThisWeek: row.used_this_week,
    usedThisMonth: row.used_this_month,
    nextRefillAt: row.next_refill_at,
    nextRefillLabel: createRefillLabel(row.next_refill_at),
  };
}

function createSpendErrorMessage(result: AurenCreditSpendResult) {
  if (result.errorCode === 'out_of_credits') {
    return `You need ${result.cost} credits for this. You have ${result.balance} available. ${result.nextRefillLabel}.`;
  }

  if (result.errorCode === 'not_authenticated') {
    return 'Please sign in to use credits.';
  }

  return `Could not spend credits${result.errorCode ? ` (${result.errorCode})` : ''}.`;
}

export function createAurenCreditSpendKey(prefix = 'message') {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export function isAurenOutOfCreditsError(error: unknown) {
  return error instanceof AurenCreditsError && error.code === 'out_of_credits';
}

export async function listAurenCreditPlans() {
  const { data, error } = await supabase
    .from('auren_credit_plans')
    .select('plan,display_name,daily_allowance,max_balance,monthly_soft_cap,is_active,created_at,updated_at')
    .eq('is_active', true)
    .order('daily_allowance', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CreditPlanRow[]).map(mapCreditPlan);
}

export async function getAurenCreditAccount(userId: string) {
  const { data, error } = await supabase
    .from('auren_credit_accounts')
    .select('id,user_id,plan,balance,daily_allowance,max_balance,used_today,used_this_week,used_this_month,current_day,current_week_start,current_month,last_refill_at,next_refill_at,created_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCreditAccount(data as CreditAccountRow) : null;
}

export async function createAurenCreditAccount(userId: string) {
  const { data, error } = await supabase
    .from('auren_credit_accounts')
    .insert({
      user_id: userId,
      plan: DEFAULT_PLAN.plan,
      balance: DEFAULT_PLAN.maxBalance,
      daily_allowance: DEFAULT_PLAN.dailyAllowance,
      max_balance: DEFAULT_PLAN.maxBalance,
    })
    .select('id,user_id,plan,balance,daily_allowance,max_balance,used_today,used_this_week,used_this_month,current_day,current_week_start,current_month,last_refill_at,next_refill_at,created_at,updated_at')
    .single();

  if (error) {
    throw error;
  }

  const account = mapCreditAccount(data as CreditAccountRow);

  try {
    await supabase.from('auren_credit_events').insert({
      user_id: userId,
      account_id: account.id,
      amount: account.balance,
      balance_after: account.balance,
      event_type: 'initial_grant',
      reason: 'account_created',
      idempotency_key: `initial_grant:${userId}`,
      metadata: { source: 'client_helper' },
    });
  } catch (eventError) {
    console.log('Auren credit initial grant event error:', eventError);
  }

  return account;
}

export async function getOrCreateAurenCreditAccount(userId: string) {
  const existingAccount = await getAurenCreditAccount(userId);

  if (existingAccount) {
    return existingAccount;
  }

  try {
    return await createAurenCreditAccount(userId);
  } catch (error) {
    const accountAfterCreateAttempt = await getAurenCreditAccount(userId);

    if (accountAfterCreateAttempt) {
      return accountAfterCreateAttempt;
    }

    throw error;
  }
}

export async function listAurenCreditEvents(userId: string, limit = 30) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const { data, error } = await supabase
    .from('auren_credit_events')
    .select('id,user_id,account_id,amount,balance_after,event_type,reason,conversation_id,project_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as CreditEventRow[]).map(mapCreditEvent);
}

export async function spendAurenCredits(input: AurenCreditSpendInput) {
  const amount = Math.max(1, Math.floor(input.amount));
  const reason = input.reason.trim();

  if (!reason) {
    throw new AurenCreditsError('Credit spend reason is required.', 'missing_reason');
  }

  const { data, error } = await supabase.rpc('auren_spend_credits', {
    p_amount: amount,
    p_reason: reason,
    p_conversation_id: input.conversationId ?? null,
    p_project_id: input.projectId ?? null,
    p_idempotency_key: input.idempotencyKey ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }

  const firstRow = Array.isArray(data) ? data[0] : data;

  if (!firstRow) {
    throw new AurenCreditsError('Credit spend returned no result.', 'empty_result');
  }

  const result = mapSpendResult(firstRow as CreditSpendRpcRow);

  if (!result.ok) {
    throw new AurenCreditsError(createSpendErrorMessage(result), result.errorCode ?? 'credit_spend_failed', result);
  }

  return result;
}

export async function getAurenCreditSummary(userId: string) {
  const account = await getOrCreateAurenCreditAccount(userId);
  let plan: AurenCreditPlan | null = null;

  try {
    const { data, error } = await supabase
      .from('auren_credit_plans')
      .select('plan,display_name,daily_allowance,max_balance,monthly_soft_cap,is_active,created_at,updated_at')
      .eq('plan', account.plan)
      .maybeSingle();

    if (error) {
      throw error;
    }

    plan = data ? mapCreditPlan(data as CreditPlanRow) : null;
  } catch (error) {
    console.log('Auren credit plan load error:', error);
  }

  return createCreditSummary(account, plan);
}

export function estimateAurenCreditCost(input: { hasImages?: boolean; inProject?: boolean }) {
  if (input.hasImages) {
    return 5;
  }

  if (input.inProject) {
    return 2;
  }

  return 1;
}

export function hasEnoughAurenCredits(summary: AurenCreditSummary, cost: number) {
  return summary.available >= Math.max(0, cost);
}
