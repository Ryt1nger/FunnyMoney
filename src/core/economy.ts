/**
 * Единый источник правил игровой экономики.
 *
 * Этот модуль намеренно не знает о React, Zustand, storage или UI. Игровые
 * периоды и экраны должны вызывать только эти чистые функции, чтобы расчеты
 * можно было проверять отдельно от интерфейса.
 */

export const ECONOMY_RULES = {
  periodIncome: 200,
  practiceRewardCoins: 20,
  practiceRewardXp: 10,
  maxPracticeRewardCoins: 100,
  maxPracticeRewardXp: 50,
  planRewardXp: 10,
  requiredSavingsDeposit: 100,
  savingsDepositXp: 15,
  cashbackCoins: 20,
  dailyRewardCoins: 100,
  dailyRewardXp: 15,
  emergencyWorkCoins: 50,
  emergencySnackPrice: 30,
  oneTimeTheoryCoins: 200,
  oneTimeTheoryXp: 10,
} as const;

export type ExpenseType = 'mandatory' | 'optional' | 'goal';
export type MealType = 'snack' | 'fullMeal' | 'none';

export interface EconomyProductMeta {
  id: string;
  price: number;
  expenseType: ExpenseType;
  mealType: MealType;
  satietyEffect: number;
  moodEffect: number;
  savingsOnly: boolean;
  periodEligible: boolean;
}

export interface BudgetPlan {
  mandatory: number;
  optional: number;
  savings: number;
}

export interface BudgetValidation {
  valid: boolean;
  total: number;
  remaining: number;
  error?: 'negative_amount' | 'over_budget' | 'required_categories_missing';
}

export interface PeriodActuals {
  mandatory: number;
  optional: number;
  savings: number;
}

export interface PeriodRewardFlags {
  planConfirmed: boolean;
  savingsDepositGranted: boolean;
  cashbackGranted: boolean;
  dailyRewardGranted: boolean;
}

export interface PeriodState {
  id: number;
  income: number;
  plan: BudgetPlan | null;
  actual: PeriodActuals;
  walletBalance: number;
  savingsBalance: number;
  rewardFlags: PeriodRewardFlags;
  status: 'planning' | 'active' | 'completed';
}

export interface PeriodResult {
  planMatchPercent: number;
  mandatoryCovered: boolean;
  savingsRegular: boolean;
  score: number;
  walletDelta: number;
  savingsDelta: number;
  satietyDelta: number;
  moodDelta: number;
  nextStep: 'plan_next_period' | 'keep_saving' | 'choose_optional_purchase';
}

export function validateBudgetPlan(income: number, plan: BudgetPlan): BudgetValidation {
  const amounts = [plan.mandatory, plan.optional, plan.savings];
  const total = amounts.reduce((sum, value) => sum + value, 0);
  const remaining = income - total;

  if (amounts.some((value) => !Number.isFinite(value) || value < 0)) {
    return { valid: false, total, remaining, error: 'negative_amount' };
  }
  if (total > income) {
    return { valid: false, total, remaining, error: 'over_budget' };
  }
  if (amounts.some((value) => value === 0)) {
    return { valid: false, total, remaining, error: 'required_categories_missing' };
  }
  return { valid: true, total, remaining };
}

export function canPurchase(
  product: EconomyProductMeta,
  walletBalance: number,
  savingsBalance: number,
): boolean {
  if (!Number.isInteger(product.price) || product.price <= 0) return false;
  if (!product.periodEligible) return false;
  return product.savingsOnly ? savingsBalance >= product.price : walletBalance >= product.price;
}

export function applyPurchase(
  product: EconomyProductMeta,
  walletBalance: number,
  savingsBalance: number,
): { walletBalance: number; savingsBalance: number; actual: PeriodActuals } | null {
  if (!canPurchase(product, walletBalance, savingsBalance)) return null;

  const nextWallet = product.savingsOnly ? walletBalance : walletBalance - product.price;
  const nextSavings = product.savingsOnly ? savingsBalance - product.price : savingsBalance;
  const actual: PeriodActuals = {
    mandatory: product.expenseType === 'mandatory' ? product.price : 0,
    optional: product.expenseType === 'optional' ? product.price : 0,
    savings: 0,
  };
  return { walletBalance: nextWallet, savingsBalance: nextSavings, actual };
}

export function calculatePeriodResult(
  period: Pick<PeriodState, 'income' | 'plan' | 'actual' | 'walletBalance' | 'savingsBalance'>,
): PeriodResult {
  const plan = period.plan ?? { mandatory: 0, optional: 0, savings: 0 };
  const planTotal = Math.max(1, plan.mandatory + plan.optional + plan.savings);
  const deviation = Math.abs(plan.mandatory - period.actual.mandatory)
    + Math.abs(plan.optional - period.actual.optional)
    + Math.abs(plan.savings - period.actual.savings);
  const planMatchPercent = Math.max(0, Math.round((1 - deviation / planTotal) * 100));
  const mandatoryCovered = period.actual.mandatory >= Math.min(plan.mandatory, 150);
  const savingsRegular = period.actual.savings >= ECONOMY_RULES.requiredSavingsDeposit;
  const score = Math.round(
    (mandatoryCovered ? 40 : 0)
      + planMatchPercent * 0.3
      + (savingsRegular ? 30 : 0),
  );

  return {
    planMatchPercent,
    mandatoryCovered,
    savingsRegular,
    score,
    walletDelta: period.walletBalance - period.income,
    savingsDelta: period.savingsBalance,
    satietyDelta: mandatoryCovered ? 20 : -20,
    moodDelta: score >= 70 ? 15 : 5,
    nextStep: savingsRegular ? 'choose_optional_purchase' : 'keep_saving',
  };
}

export function developmentStageFromPeriods(goodPeriods: number): 1 | 2 | 3 {
  if (goodPeriods >= 4) return 3;
  if (goodPeriods >= 2) return 2;
  return 1;
}

