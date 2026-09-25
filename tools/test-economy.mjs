import assert from 'node:assert/strict';
import {
  ECONOMY_RULES,
  applyPurchase,
  calculatePeriodResult,
  canPurchase,
  developmentStageFromPeriods,
  validateBudgetPlan,
} from '../src/core/economy.ts';

assert.equal(validateBudgetPlan(200, { mandatory: 120, optional: 30, savings: 50 }).valid, true);
assert.equal(validateBudgetPlan(200, { mandatory: 120, optional: 30, savings: 60 }).error, 'over_budget');
assert.equal(validateBudgetPlan(200, { mandatory: 120, optional: 0, savings: 80 }).error, 'required_categories_missing');

const meal = { id: 'meal', price: 120, expenseType: 'mandatory', mealType: 'fullMeal', satietyEffect: 20, moodEffect: 0, savingsOnly: false, periodEligible: true };
const goal = { id: 'goal', price: 300, expenseType: 'goal', mealType: 'none', satietyEffect: 0, moodEffect: 10, savingsOnly: true, periodEligible: true };
assert.equal(canPurchase(meal, 120, 0), true);
assert.equal(canPurchase(goal, 200, 300), false);
assert.equal(applyPurchase(goal, 200, 300), null);

const result = calculatePeriodResult({
  income: ECONOMY_RULES.periodIncome,
  plan: { mandatory: 120, optional: 30, savings: 50 },
  actual: { mandatory: 120, optional: 30, savings: 100 },
  walletBalance: 0,
  savingsBalance: 100,
  startingWalletBalance: 200,
  startingSavingsBalance: 0,
});
assert.equal(result.mandatoryCovered, true);
assert.equal(result.savingsRegular, true);
assert.equal(result.score, 93);
assert.equal(result.walletDelta, -200);
assert.equal(result.savingsDelta, 100);
assert.equal(developmentStageFromPeriods(0), 1);
assert.equal(developmentStageFromPeriods(2), 2);
assert.equal(developmentStageFromPeriods(4), 3);

console.log('Economy core checks passed');
