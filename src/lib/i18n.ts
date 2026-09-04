/**
 * The UI is Bulgarian-only. Strings live here (not inline) so a second language
 * can be added later without hunting through components. Usage: `t('save')`.
 */
export const bg = {
  appTitle: 'Родословно дърво',
  appSubtitle: 'Родът „Брусарите“ — клон Тано Раде Брусарски',

  // auth
  signIn: 'Вход с Google',
  signOut: 'Изход',
  signedInAs: 'Влезли сте като',
  editorBadge: 'редактор',
  viewerBadge: 'наблюдател',
  notEditorHint:
    'Този акаунт няма права за редакция. Свържете се със стопанина на дървото, за да ви добави.',

  // access gate (shown before the tree; only invited accounts get past it)
  gateBody:
    'Достъпът е ограничен само за поканени членове на семейството. Влезте с Google, за да продължите.',
  restrictedTitle: 'Нямате достъп',
  restrictedBody: (email: string) =>
    `Акаунтът „${email}“ не е поканен за това родословно дърво. Ако смятате, че трябва да имате достъп, свържете се със стопанина на дървото.`,
  tryAnotherAccount: 'Изход (опитайте с друг акаунт)',

  // toolbar
  search: 'Търсене на човек…',
  fit: 'Побиране в екрана',
  expandAll: 'Разгъни всички',
  collapseAll: 'Свий всички',
  zoomIn: 'Приближи',
  zoomOut: 'Отдалечи',
  exportPng: 'Изтегли като PNG',
  exportJson: 'Експорт (JSON)',
  importJson: 'Импорт (JSON)',
  addRoot: 'Добави начален човек',

  // person panel
  close: 'Затвори',
  born: 'Роден/а',
  died: 'Починал/а',
  birthPlace: 'Месторождение',
  spouse: 'Съпруг/а',
  note: 'Бележка',
  parent: 'Роднина (родител)',
  children: 'Деца',
  unverified: 'Непроверено — данните от снимката са несигурни.',
  edit: 'Редакция',
  addChild: 'Добави дете',
  deletePerson: 'Изтрий',

  // form
  formAddTitle: 'Нов човек',
  formEditTitle: 'Редакция на човек',
  fName: 'Име',
  fSurname: 'Фамилия',
  fGender: 'Пол',
  gMale: 'Мъж',
  gFemale: 'Жена',
  gUnknown: 'Не е посочен',
  fBirthYear: 'Година на раждане',
  fDeathYear: 'Година на смърт',
  fBirthPlace: 'Месторождение',
  fSpouse: 'Съпруг/а',
  fParent: 'Дете на',
  fChildOrder: 'Подредба между братя и сестри',
  fNote: 'Бележка',
  fVerified: 'Данните са проверени',
  noParent: '— няма (начален човек) —',
  save: 'Запис',
  cancel: 'Отказ',
  saving: 'Записване…',

  // delete
  deleteTitle: 'Изтриване на човек',
  deleteConfirm: (name: string) =>
    `Да се изтрие ли „${name}“? Това действие е необратимо.`,
  deleteBlockedHasChildren: (name: string, n: number) =>
    `„${name}“ има ${n} потомък/ци в дървото. Първо преместете или изтрийте тях.`,
  confirmYes: 'Да, изтрий',

  // import
  importTitle: 'Импорт на данни',
  importHint:
    'Поставете JSON масив от хора или заредете началните данни от снимката. ' +
    'Импортът добавя/презаписва по id и не трие съществуващи записи.',
  importLoadSeed: 'Зареди началните данни от снимката',
  importRun: 'Импортирай',
  importDone: (n: number) => `Готово. Записани ${n} записа.`,
  importBadJson: 'Невалиден JSON.',

  // misc
  loading: 'Зареждане…',
  emptyTreeTitle: 'Дървото е празно',
  emptyTreeBody:
    'Влезте като редактор и натиснете „Добави начален човек“, ' +
    'или използвайте „Импорт“, за да заредите началните данни.',
  configMissingTitle: 'Firebase не е настроен',
  configMissingBody:
    'Копирайте .env.example като .env.local и попълнете стойностите от ' +
    'Firebase конзолата. Вижте README.md.',
  errorPrefix: 'Грешка',
} as const

export type MessageKey = keyof typeof bg

/** Keys whose value is a plain string (the ones `t()` accepts). */
export type StringKey = {
  [K in keyof typeof bg]: (typeof bg)[K] extends string ? K : never
}[keyof typeof bg]

export function t(key: StringKey): string {
  return bg[key] as string
}

export const motto = 'Опо, знай рода си, за да си горд! Човек без роднини е сам.'
