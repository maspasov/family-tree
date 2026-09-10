/**
 * Generates the big fixture tree consumed by the e2e suite, in the app's
 * import-JSON shape (`Array<Partial<Person>>` — same as Actions → Export/Import).
 *
 *   node e2e/gen-tree.mjs > e2e/test-tree.json      (or: yarn e2e:gen)
 *
 * Deterministic (seeded PRNG): re-running yields the same tree, and re-importing
 * updates rows by `id` instead of duplicating. Kept intentionally varied so the
 * suite exercises: deep + wide layout, spouses (merged cards), unverified flag,
 * birth/death year formats, birthday calendar events, long names, childOrder.
 */

// deterministic PRNG (mulberry32)
let _s = 0xc0ffee
const rnd = () => {
  _s |= 0
  _s = (_s + 0x6d2b79f5) | 0
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (a) => a[Math.floor(rnd() * a.length)]
const chance = (p) => rnd() < p

const M = ['Иван', 'Георги', 'Петър', 'Тодор', 'Стоян', 'Никола', 'Димитър', 'Христо', 'Ангел', 'Васил', 'Кирил', 'Марин', 'Асен', 'Борис', 'Любен', 'Пенчо', 'Захари', 'Милен', 'Огнян', 'Радослав']
const F = ['Мария', 'Иванка', 'Елена', 'Пенка', 'Стойка', 'Ана', 'Виолета', 'Радка', 'Донка', 'Величка', 'Севда', 'Галина', 'Йорданка', 'Румяна', 'Здравка', 'Таня', 'Невена', 'Цветана', 'Магдалена', 'Лиляна']
const SUR = ['Брусарски', 'Тодоров', 'Петров', 'Стоянов', 'Николов', 'Ангелов', 'Маринов', 'Захариев', 'Вранчев', 'Гошев']
const PLACES = ['с. Враняк, Врачанско', 'гр. Враца', 'гр. София', 'с. Борован', 'гр. Бяла Слатина', 'гр. Монтана', 'гр. Пловдив', 'Чикаго, САЩ', 'гр. Варна', 'с. Мало Пещене']

const fem = (w) => w.replace(/ев$/, 'ева').replace(/ов$/, 'ова').replace(/ски$/, 'ска')
const surOf = (base, g) => (g === 'f' ? fem(base) : base)
// „Иван“ → „Иванов“, „Пенчо“ → „Пенчов“; feminine adds -а
const patro = (fatherFirst, g) => {
  const stem = /[аеиоуяю]$/i.test(fatherFirst) ? fatherFirst + 'в' : fatherFirst + 'ов'
  return g === 'f' ? stem + 'а' : stem
}
const fullOf = (p) => [p.name, p.patronymic, p.surname].filter(Boolean).join(' ')

const GENS = Number(process.env.GENS || 6)
const people = []
let n = 0
const nextId = (suff) => `p${String(++n).padStart(3, '0')}${suff ? '_' + suff : ''}`

const root = {
  id: 'root', name: pick(M), patronymic: patro(pick(M), 'm'), surname: 'Брусарски',
  parentId: null, gender: 'm', birthYear: '~1855', deathYear: '~1921',
  birthPlace: PLACES[0], childOrder: 0, verified: false,
  note: 'Родоначалник на тестовия клон.',
}
people.push(root)
let prevGen = [root]

for (let g = 1; g < GENS; g++) {
  const thisGen = []
  for (const father of prevGen) {
    const kids = g === 1 ? 10 : g >= 4 ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 3)
    for (let k = 0; k < kids; k++) {
      const gen = chance(0.48) ? 'f' : 'm'
      const base = pick(SUR)
      const born = 1855 + g * 27 + Math.floor(rnd() * 12)
      const long = g === 2 && k === 0 // one deliberately overlong name
      const alive = g >= GENS - 2 && chance(0.7)
      const person = {
        id: nextId(),
        name: long ? pick(gen === 'f' ? F : M) + '-' + pick(F) : pick(gen === 'f' ? F : M),
        patronymic: patro(father.name, gen),
        surname: surOf(base, gen),
        parentId: father.id,
        gender: gen,
        birthYear: g <= 1 && chance(0.3) ? `~${born}` : chance(0.06) ? `${born}?` : String(born),
        birthPlace: pick(PLACES),
        childOrder: chance(0.5) ? k : undefined,
        verified: chance(0.12) ? false : undefined,
      }
      if (!alive) person.deathYear = String(born + 55 + Math.floor(rnd() * 30))
      if (chance(0.35)) person.birthMonthDay = `${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`
      if (chance(0.15)) person.note = pick(['Ковач по занаят.', 'Преселил се в града.', 'Учител.', 'Емигрант.', 'По разказ на баба.'])

      if (chance(0.7)) {
        const sg = gen === 'm' ? 'f' : 'm'
        const spouse = {
          id: nextId('sp'),
          name: pick(sg === 'f' ? F : M),
          surname: surOf(pick(SUR), sg),
          parentId: father.id,
          gender: sg,
          birthYear: String(born + Math.floor(rnd() * 6) - 3),
          birthPlace: pick(PLACES),
          relation: { type: sg === 'f' ? 'wife' : 'husband', toId: person.id, toName: fullOf(person) },
        }
        people.push(spouse)
      }
      people.push(person)
      if (gen === 'm') thisGen.push(person)
    }
  }
  prevGen = thisGen
}

// one mutual wife<->husband pair (exercises isMergedSpouse's tie-break)
const w = people.find((p) => p.relation?.type === 'wife')
if (w) {
  const anchor = people.find((p) => p.id === w.relation.toId)
  if (anchor) anchor.relation = { type: 'husband', toId: w.id, toName: fullOf(w) }
}

const clean = people.map((p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)))
process.stderr.write(`generated ${clean.length} people, ${GENS} generations\n`)
process.stdout.write(JSON.stringify(clean, null, 2) + '\n')
