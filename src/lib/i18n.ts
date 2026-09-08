import type { RelationType } from '../model/person'

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
  actions: 'Действия',
  addRoot: 'Добави начален човек',
  addPerson: 'Добави човек',
  viewTree: 'Дърво',
  viewMap: 'Карта',
  viewCalendar: 'Календар',
  viewArchive: 'Архив',
  mapEmptyTitle: 'Няма отбелязани адреси',
  mapEmptyBody:
    'Добавете адрес на поне един човек (бутонът за локация във формата), за да се появят точки на картата.',
  calendarEmptyTitle: 'Няма въведени рождени дни',
  calendarEmptyBody:
    'Добавете „Рожден ден (ММ-ДД)“ на поне един човек във формата за редакция, за да се появят събития в календара.',

  // Calendar export (.ics — no account, works with any calendar app)
  calendarExport: 'Изтегли календар (.ics)',
  icsNoBirthdays: 'Никой няма въведен рожден ден (ММ-ДД). Добавете поне един във формата за редакция.',

  // person panel
  close: 'Затвори',
  born: 'Роден/а',
  died: 'Починал/а',
  birthPlace: 'Месторождение',
  address: 'Адрес',
  photos: 'Снимки',
  addPhoto: 'Добави снимка',
  removePhoto: 'Премахни снимката',
  photoUploading: 'Качване…',
  spouse: 'Съпруг/а',
  note: 'Бележка',
  parent: 'Роднина (родител)',
  mother: 'Майка',
  father: 'Баща',
  relation: 'Роднинска връзка',
  children: 'Деца',
  unverified: 'Непроверено — данните от снимката са несигурни.',
  edit: 'Редакция',
  addChild: 'Добави дете',
  deletePerson: 'Изтрий',

  // form
  formAddTitle: 'Нов човек',
  formEditTitle: 'Редакция на човек',
  fName: 'Име',
  fPatronymic: 'Презиме',
  fSurname: 'Фамилия',
  fMother: 'Майка',
  fFather: 'Баща',
  fRelationType: 'Роднинска връзка',
  noRelation: '— без указана връзка —',
  fRelationTo: 'Спрямо кого',
  fRelationCustomLabel: 'Име на връзката',
  fGender: 'Пол',
  gMale: 'Мъж',
  gFemale: 'Жена',
  gUnknown: 'Не е посочен',
  fBirthYear: 'Година на раждане',
  fDeathYear: 'Година на смърт',
  fBirthMonthDay: 'Рожден ден (ММ-ДД)',
  fBirthPlace: 'Месторождение',
  fAddress: 'Адрес (за картата)',
  locate: 'Намери координати',
  locating: 'Търсене…',
  locateFound: 'Координатите са намерени.',
  locateNotFound: 'Адресът не е намерен. Опитайте по-точен адрес.',
  locateError: 'Грешка при търсене на адреса.',
  addressChangedWarning:
    'Адресът е променен след последното търсене — натиснете иконата за локация, за да обновите координатите.',
  clearPin: 'Премахни координатите',
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

export const motto = 'Опознай рода си, за да си горд! Човек без роднини е сам.'

export const RELATION_LABELS: Record<RelationType, string> = {
  child: 'Дете',
  father: 'Баща',
  mother: 'Майка',
  grandfather: 'Дядо',
  grandmother: 'Баба',
  aunt: 'Леля',
  uncle: 'Вуйчо',
  cousin: 'Братовчед',
  other: 'Друго',
}
