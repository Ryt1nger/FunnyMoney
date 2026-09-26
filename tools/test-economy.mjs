import assert from 'node:assert/strict';
import {
  applyPurchase,
  calculatePeriodResult,
  canPurchase,
  developmentStageFromPeriods,
  validateBudgetPlan,
} from '../src/core/economy.ts';
import { PERIOD_EVENTS, getPeriodEvents } from '../src/features/periodEvents/eventData.ts';

assert.equal(validateBudgetPlan(200, { mandatory: 120, optional: 30, savings: 50 }).valid, true);
assert.equal(validateBudgetPlan(200, { mandatory: 120, optional: 30, savings: 60 }).error, 'over_budget');
assert.equal(validateBudgetPlan(200, { mandatory: 120, optional: 0, savings: 80 }).error, 'required_categories_missing');

const meal = { id: 'meal', price: 120, expenseType: 'mandatory', mealType: 'fullMeal', satietyEffect: 20, moodEffect: 0, savingsOnly: false, periodEligible: true };
const goal = { id: 'goal', price: 300, expenseType: 'goal', mealType: 'none', satietyEffect: 0, moodEffect: 10, savingsOnly: true, periodEligible: true };
assert.equal(canPurchase(meal, 120, 0), true);
assert.equal(canPurchase(goal, 200, 300), false);
assert.equal(applyPurchase(goal, 200, 300), null);
assert.equal(canPurchase(goal, 300, 0), true);
assert.deepEqual(applyPurchase(goal, 300, 0), {
  walletBalance: 0,
  savingsBalance: 0,
  actual: { mandatory: 0, optional: 0, savings: 0 },
});

const result = calculatePeriodResult({
  income: 200,
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

// Каталог сюжетных событий: три события на каждый период, уникальные id и
// непрерывная цепочка открытия — это защита от рассинхронизации визуала и
// событийного стора.
assert.equal(PERIOD_EVENTS.length, 9);
assert.deepEqual([1, 2, 3].map((id) => getPeriodEvents(id).length), [3, 3, 3]);
assert.equal(new Set(PERIOD_EVENTS.map((event) => event.id)).size, 9);
for (const periodId of [1, 2, 3]) {
  const events = getPeriodEvents(periodId);
  assert.equal(events[0].previousEventId, undefined);
  assert.equal(events[1].previousEventId, events[0].id);
  assert.equal(events[2].previousEventId, events[1].id);
  assert.ok(events[0].lessonId, `period ${periodId} first event needs first lesson`);
  assert.equal(events[1].lessonId, undefined, `period ${periodId} second event is before second lesson`);
  assert.ok(events[2].lessonId, `period ${periodId} final event needs second lesson`);
}

console.log('Economy and period-event checks passed');
