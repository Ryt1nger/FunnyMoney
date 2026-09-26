/**
 * Общий визуальный слой для сюжетных событий периода — вынесен отдельно от
 * eventData/eventStore (логика) и от конкретных компонентов, чтобы формулы
 * "как показать эффект/вариант" не дублировались в EventModal/EventOptionCard/
 * EventResult по отдельности.
 */
import type { ReactNode } from 'react';
import type { EventEffects, PeriodEventOption } from './eventData';

import iconBasket from '../../assets/periods/event-icons/basket.png';
import iconBowlEmpty from '../../assets/periods/event-icons/bowl-empty.png';
import iconBowlFood from '../../assets/periods/event-icons/bowl-food.png';
import iconCoinStack from '../../assets/periods/event-icons/coin-stack.png';
import iconCoinsToPiggyBig from '../../assets/periods/event-icons/coins-to-piggy-big.png';
import iconCoinsToPiggySmall from '../../assets/periods/event-icons/coins-to-piggy-small.png';
import iconFoodBagBlue from '../../assets/periods/event-icons/food-bag-blue.png';
import iconFoodBagRed from '../../assets/periods/event-icons/food-bag-red.png';
import iconGamepadComboBowl from '../../assets/periods/event-icons/gamepad-combo-bowl.png';
import iconGamepadCombo from '../../assets/periods/event-icons/gamepad-combo.png';
import iconIceCream from '../../assets/periods/event-icons/ice-cream.png';
import iconPiggyBroken from '../../assets/periods/event-icons/piggy-broken.png';
import iconPiggyCoinDrop from '../../assets/periods/event-icons/piggy-coin-drop.png';
import iconQuestionCloud from '../../assets/periods/event-icons/question-cloud.png';
import iconShampooLavender from '../../assets/periods/event-icons/shampoo-lavender.png';
import iconShampooTealCoins from '../../assets/periods/event-icons/shampoo-teal-coins.png';
import iconStickers from '../../assets/periods/event-icons/stickers.png';
import iconTreatBone from '../../assets/periods/event-icons/treat-bone.png';
import iconTruckBallCoin from '../../assets/periods/event-icons/truck-ball-coin.png';
import iconTruck from '../../assets/periods/event-icons/truck.png';
import iconVitamins from '../../assets/periods/event-icons/vitamins.png';

// Иконки строк эффектов на экране последствий — те же ассеты, что и в
// статистике на главном экране/странице статистики (Здоровье/Счастье/
// Богатство), плюс монетка из шапки баланса и копилка.
import coinIcon from '../../assets/icons/coin.png';
import heartMetricIcon from '../../assets/icons/metrics/heart-3d.png';
import smileMetricIcon from '../../assets/icons/metrics/smile-3d.png';
import coinsMetricIcon from '../../assets/icons/metrics/coins-3d.png';
import piggyIcon from '../../assets/piggy-bank/piggy.png';

export interface EffectRow {
  key: string;
  label: string;
  value: number;
  icon: string;
  /** Суффикс у числа — '%' для метрик 0..100 (Богатство/Здоровье/Счастье,
   * та же шкала, что и в статистике на главном экране), пусто для монет
   * (Монеты/Копилка — это валюта, не проценты). */
  unit: string;
}

/** Строки для экрана последствий — только реально присутствующие эффекты,
 * в фиксированном порядке (монеты → копилка → богатство → здоровье → счастье). */
export function buildEffectRows(effects: EventEffects): EffectRow[] {
  const rows: EffectRow[] = [];
  if (effects.coins) rows.push({ key: 'coins', label: 'Монеты', value: effects.coins, icon: coinIcon, unit: '' });
  if (effects.savings) rows.push({ key: 'savings', label: 'Копилка', value: effects.savings, icon: piggyIcon, unit: '' });
  // Богатство/Здоровье/Счастье — те же метрики 0..100%, что и на главном
  // экране (GlassMetric), эффекты событий — точечные приращения по этой же
  // шкале (см. eventStore.applyChoice: applyWealthDelta / petStore.applyDelta).
  // Сама механика не меняется — только подпись значения дополнена "%".
  if (effects.wealth) rows.push({ key: 'wealth', label: 'Богатство', value: effects.wealth, icon: coinsMetricIcon, unit: '%' });
  if (effects.health) rows.push({ key: 'health', label: 'Здоровье', value: effects.health, icon: heartMetricIcon, unit: '%' });
  if (effects.happiness) rows.push({ key: 'happiness', label: 'Счастье', value: effects.happiness, icon: smileMetricIcon, unit: '%' });
  return rows;
}

/**
 * Иконки вариантов — вырезаны из ассетов, присланных для макетов, и
 * сопоставлены 1:1 с тем, что реально нарисовано в макете каждого события
 * (не по эвристике). Для вариантов, где в макете показаны два предмета
 * сразу (например "корм + шампунь"), используется пара картинок.
 */
const OPTION_ICON_FILES: Record<string, [string] | [string, string]> = {
  // period-1-feed-first — макета для этого события не было; иконки подобраны по смыслу.
  'buy-food': [iconBowlFood],
  'buy-toy': [iconTruck],
  'buy-nothing': [iconCoinStack],

  // period-1-help-reward
  'keep-all': [iconCoinStack],
  'buy-ice-cream': [iconIceCream],
  'buy-big-toy': [iconTruck],

  // period-1-bowl-breaks
  'replace-bowl': [iconBowlEmpty],
  'buy-entertainment': [iconGamepadCombo],
  'buy-both': [iconGamepadComboBowl],

  // period-2-smart-shopping
  'food-a': [iconFoodBagRed, iconShampooLavender],
  'food-b': [iconFoodBagBlue, iconShampooLavender],
  'add-treat': [iconFoodBagBlue, iconTreatBone],

  // period-2-real-discount
  'sale-toy': [iconTruck],
  // В макете — бело-голубой флакон, которого нет ни на одном из 4 присланных
  // шитов; взят ближайший похожий шампунь-флакон как приближение.
  'sale-shampoo': [iconShampooLavender],
  'skip-sale': [iconCoinStack],

  // period-2-overloaded-cart
  'remove-stickers': [iconStickers],
  'remove-vitamins': [iconVitamins],
  'pay-over-budget': [iconBasket],

  // period-3-dream-house
  'save-ten': [iconCoinsToPiggySmall],
  'save-all': [iconCoinsToPiggyBig],
  'spend-all': [iconTruckBallCoin],

  // period-3-plan-changed
  'important-purchase': [iconShampooTealCoins],
  'money-disappeared': [iconQuestionCloud],
  'piggy-broke': [iconPiggyBroken],

  // period-3-last-ten
  'save-last-ten': [iconPiggyCoinDrop],
  'buy-last-toy': [iconTruck],
  'split-last-ten': [iconCoinStack, iconTruck],
};

function optionIconBg(option: PeriodEventOption): string {
  const savings = option.effects.savings ?? 0;
  if (savings > 0) return '#f1e9ff';
  if (savings < 0) return '#fff6df';
  if (option.expenseType === 'mandatory') return '#e8f0ff';
  if (option.expenseType === 'optional') return '#ffe9ef';
  return '#e6f9ee';
}

/** Иконка + цвет фона карточки варианта. Иконка — реальный вырезанный ассет
 * по id варианта (см. OPTION_ICON_FILES), фон — по смыслу варианта
 * (копилка/обязательное/желание/нейтральное). */
export function optionVisual(option: PeriodEventOption): { icon: ReactNode; bg: string } {
  const files = OPTION_ICON_FILES[option.id];
  const bg = optionIconBg(option);
  if (!files) return { icon: null, bg };

  if (files.length === 1) {
    return { icon: <img src={files[0]} alt="" className="h-9 w-9 object-contain" />, bg };
  }

  return {
    icon: (
      <span className="flex items-center">
        <img src={files[0]} alt="" className="h-8 w-8 object-contain" />
        <img src={files[1]} alt="" className="-ml-2 h-7 w-7 object-contain" />
      </span>
    ),
    bg,
  };
}

/** Строка "стоимость / изменение" под названием варианта. */
export function formatOptionCost(option: PeriodEventOption): { text: string; color: string } {
  const coins = option.effects.coins ?? 0;
  const savings = option.effects.savings ?? 0;
  if (coins) return { text: `${coins > 0 ? '+' : ''}${coins} монет`, color: coins > 0 ? '#22a35a' : '#ed4e5d' };
  if (savings > 0) return { text: `+${savings} монет в цель`, color: '#22a35a' };
  if (savings < 0) return { text: `${savings} монет из копилки`, color: '#ed4e5d' };
  return { text: 'Без затрат', color: '#8a8fbf' };
}
