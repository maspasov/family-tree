import type { Person } from '../model/person'

/**
 * Starter data transcribed from the 1987 hand-drawn chart
 * „РОДОСЛОВНО ДЪРВО НА ЧАСТ ОТ РОДА «БРУСАРИТЕ» — КЛОН ТАНО РАДЕ БРУСАРСКИ“.
 *
 *   Автор: инж. Тодор Танев-Брусарски (братов внук на дедо Тано)
 *   Сътрудник: Станю Йотов (внук на дедо Тано)
 *   Дедо Тано: род. ~1860 г., поч. ~1920 г., с. Враняк, Врачанско.
 *   Мото: „Опознай рода си, за да си горд! Човек без роднини е сам.“
 *
 * Only the parts that are clearly legible in the photograph are included:
 *   - the root, дедо Раде (Радю), and his six children;
 *   - дедо Тано's five children (поколение II).
 *
 * Поколения III–VI on the drawing are dense handwritten Cyrillic that cannot be
 * transcribed reliably from the photo. Add them in the app (button „Добави дете“)
 * or edit this file and re-import. Rows marked `verified: false` need a human to
 * confirm the reading.
 *
 * `id` values are stable slugs so re-importing updates rows instead of
 * duplicating them.
 */
type SeedPerson = Omit<Person, 'createdAt' | 'updatedAt' | 'updatedByEmail'>

export const seedPeople: SeedPerson[] = [
  {
    id: 'rade',
    name: 'Раде',
    surname: 'Брусарски',
    parentId: null,
    gender: 'm',
    note: 'Дедо Радю — родоначалник на клона. Баща на дедо Тано. (Личните му данни не са дадени в чертежа.)',
    verified: false,
    childOrder: 0,
  },

  // --- Деца на дедо Радю ---
  {
    id: 'tano',
    name: 'Тано',
    surname: 'Радев Брусарски',
    parentId: 'rade',
    gender: 'm',
    birthYear: '~1860',
    deathYear: '~1920',
    birthPlace: 'с. Враняк, Врачанско',
    note: '„Дедо Тано“. Клонът на родословното дърво носи неговото име.',
    verified: true,
    childOrder: 1,
  },
  {
    id: 'tsano',
    name: 'Цано',
    surname: 'Радев Брусарски',
    parentId: 'rade',
    gender: 'm',
    verified: true,
    childOrder: 2,
  },
  {
    id: 'tato',
    name: 'Тато',
    surname: 'Радев Брусарски',
    parentId: 'rade',
    gender: 'm',
    note: 'Разчитането на името от снимката е несигурно (Тато / Тото).',
    verified: false,
    childOrder: 3,
  },
  {
    id: 'ivan-radev',
    name: 'Иван',
    surname: 'Радев Брусарски',
    parentId: 'rade',
    gender: 'm',
    verified: true,
    childOrder: 4,
  },
  {
    id: 'damyan',
    name: 'Дамян',
    surname: 'Радев Брусарски',
    parentId: 'rade',
    gender: 'm',
    verified: true,
    childOrder: 5,
  },
  {
    id: 'stayka',
    name: 'Стайка',
    surname: 'Радева Брусарска',
    parentId: 'rade',
    gender: 'f',
    verified: true,
    childOrder: 6,
  },

  // --- Поколение II: деца на дедо Тано ---
  {
    id: 'tano-todor',
    name: 'Тодор',
    surname: 'Танев Брусарски',
    parentId: 'tano',
    gender: 'm',
    verified: true,
    childOrder: 1,
  },
  {
    id: 'tano-marin',
    name: 'Марин',
    surname: 'Танев Брусарски',
    parentId: 'tano',
    gender: 'm',
    verified: true,
    childOrder: 2,
  },
  {
    id: 'tano-ivan',
    name: 'Иван',
    surname: 'Танев Брусарски',
    parentId: 'tano',
    gender: 'm',
    verified: true,
    childOrder: 3,
  },
  {
    id: 'tano-yona',
    name: 'Йона',
    surname: 'Танева Брусарска',
    parentId: 'tano',
    gender: 'f',
    verified: true,
    childOrder: 4,
  },
  {
    id: 'tano-spas',
    name: 'Спас',
    surname: 'Танев Брусарски',
    parentId: 'tano',
    gender: 'm',
    verified: true,
    childOrder: 5,
  },
]

export default seedPeople
