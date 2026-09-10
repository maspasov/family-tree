import type { RelationType } from '../../model/person'

export const messages = {
  appTitle: 'Родословно дърво',
  appSubtitle: 'Онлайн родословно дърво за семейството',

  // auth
  signIn: 'Вход с Google',
  signOut: 'Изход',
  signedInAs: 'Влезли сте като',
  editorBadge: 'редактор',
  viewerBadge: 'наблюдател',
  notEditorHint:
    'Този акаунт няма права за редакция. Свържете се със стопанина на дървото, за да ви добави.',

  // roles admin page
  rolesMenuLabel: 'Роли',
  rolesTitle: 'Роли и достъп',
  rolesIntro:
    'Управлявайте кой има достъп до дървото. Редакторите могат да преглеждат и редактират; наблюдателите — само да преглеждат.',
  rolesEditors: 'Редактори',
  rolesViewers: 'Наблюдатели',
  rolesEmptyEditors: 'Няма редактори.',
  rolesEmptyViewers: 'Няма наблюдатели.',
  rolesAddPlaceholder: 'имейл@example.com',
  rolesAddButton: 'Добави',
  rolesRemove: 'Премахни',
  rolesInvalidEmail: 'Невалиден имейл адрес.',
  rolesDuplicate: 'Този имейл вече е в списъка.',
  rolesLastEditorError: 'Трябва да остане поне един редактор.',
  rolesSelfRemoveConfirm: 'Ще премахнете себе си от редакторите. Продължавате ли?',

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
  mapLocateMe: 'Покажи моето местоположение',
  mapYouAreHere: 'Вие сте тук',
  mapLocateDenied: 'Достъпът до местоположението е отказан от браузъра.',
  mapLocateError: 'Местоположението не може да бъде определено.',
  calendarEmptyTitle: 'Няма въведени рождени дни',
  calendarEmptyBody:
    'Добавете „Рожден ден (ММ-ДД)“ на поне един човек във формата за редакция, за да се появят събития в календара.',
  menuLabel: 'Меню',
  darkMode: 'Тъмна тема',
  lightMode: 'Светла тема',
  language: 'Език',
  layoutDown: '⬇ надолу',
  layoutUp: '⬆ нагоре',
  layoutDownMenu: 'Разгъване надолу',
  layoutUpMenu: 'Разгъване нагоре',

  // Calendar export (.ics — no account, works with any calendar app)
  calendarExport: 'Изтегли календар (.ics)',
  icsNoBirthdays: 'Никой няма въведен рожден ден (ММ-ДД). Добавете поне един във формата за редакция.',

  // person panel
  close: 'Затвори',
  born: 'Роден/а',
  died: 'Починал/а',
  birthPlace: 'Месторождение',
  address: 'Адрес',
  email: 'Имейл',
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
  relationConnector: 'на',
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
  fNameEnSection: 'Име на латиница (по желание)',
  fNameEn: 'Име (EN)',
  fPatronymicEn: 'Презиме (EN)',
  fSurnameEn: 'Фамилия (EN)',
  fMother: 'Майка',
  fFather: 'Баща',
  fRelationType: 'Роднинска връзка',
  noRelation: '— без указана връзка —',
  fRelationTo: 'Спрямо кого',
  fRelationCustomLabel: 'Име на връзката',
  fRelationCustomLabelPlaceholder: 'напр. Кръстник',
  fRelationToHelpFather: 'Избраният човек ще стане дете на новия — виж предупреждението по-долу.',
  fRelationToHelpSpouse: 'Ще се покаже като брачна връзка в картичката на избрания човек.',
  fRelationToHelpLabelOnly: 'Само описателно — не променя мястото в дървото.',
  fRelationFatherWarning: (name: string) =>
    `При запис „${name}“ ще стане дете на новия човек в дървото (полето „Дете на“ по-долу засяга само мястото на новия човек, не на „${name}“).`,
  fGender: 'Пол',
  gMale: 'Мъж',
  gFemale: 'Жена',
  gUnknown: 'Не е посочен',
  fBirthYear: 'Година на раждане',
  fDeathYear: 'Година на смърт',
  fBirthMonthDay: 'Рожден ден (ММ-ДД)',
  fBirthPlace: 'Месторождение',
  fAddress: 'Адрес (за картата)',
  fEmail: 'Имейл',
  notifySent: (email: string) => `Изпратен е имейл до ${email}.`,
  notifyFailed: (email: string) => `Неуспешно изпращане на имейл до ${email}.`,
  locate: 'Намери координати',
  locating: 'Търсене…',
  locateFound: 'Координатите са намерени.',
  locateNotFound: 'Адресът не е намерен. Опитайте по-точен адрес.',
  locateError: 'Грешка при търсене на адреса.',
  addressChangedWarning:
    'Адресът е променен след последното търсене — натиснете иконата за локация, за да обновите координатите.',
  clearPin: 'Премахни координатите',
  clear: 'Изчисти',
  fSpouse: 'Съпруг/а',
  fParent: 'Дете на',
  fChildOrder: 'Подредба между братя и сестри',
  fNote: 'Бележка',
  fVerified: 'Данните са проверени',
  noParent: '— няма (начален човек) —',
  save: 'Запис',
  cancel: 'Отказ',
  saving: 'Записване…',
  discardEditConfirm: 'Имате незаписани промени. Да ги отхвърля ли?',

  // add-person wizard
  back: 'Назад',
  next: 'Напред',
  optional: 'по желание',
  yes: 'Да',
  no: 'Не',
  wizStepOf: (n: number, total: number) => `Стъпка ${n} от ${total}`,
  wizRelTitle: 'Как е свързан новият човек с дървото?',
  wizRelPickAnchor: 'Изберете роднина, който вече е в дървото',
  wizRelChild: (name: string) => `Дете на ${name}`,
  wizRelSpouse: (name: string) => `Съпруг или съпруга на ${name}`,
  wizRelParent: (name: string) => `Родител на ${name}`,
  wizNameTitle: 'Как се казва новият човек?',
  wizDetailsTitle: 'Още малко информация',
  wizDetailsHint: 'Всичко тук е по желание — може просто да натиснете „Напред“.',
  wizAlive: 'Този човек жив ли е?',
  wizReviewTitle: 'Проверете и запазете',
  wizReviewLine: (name: string, rel: string) => `Ще добавите ${name} — ${rel}.`,
  wizPhraseChildOf: (name: string) => `дете на ${name}`,
  wizPhraseSpouseOf: (name: string) => `съпруг/съпруга на ${name}`,
  wizPhraseParentOf: (name: string) => `родител на ${name}`,
  wizPhraseFirst: 'началния човек в дървото',

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

  // org-chart card (raw HTML, outside React — see FamilyChart.tsx/FamilyMap.tsx)
  synthRootLabel: 'Родословно дърво',
  noName: 'Без име',
  unverifiedFlagTitle: 'Непроверено',
  quickLinkEditTitle: 'Редакция',
  quickLinkMapTitle: 'Виж на картата',
  quickLinkCalendarTitle: 'Виж в календара',
  quickLinkDeleteTitle: 'Изтрий',
  peopleAtAddress: (n: number) => `${n} души на този адрес`,

  // archive view
  archiveTitle: 'Архив на рода',
  archiveIntro: 'Оригиналните страници от 1987 г., по които е изградено това родословно дърво.',
  archiveCaption1: '„Кратък очерк“ — написан от Димитър, внук на дядо Цано, 9.XII.1987 г.',
  archiveCaption2: 'Родословно дърво на рода „Брусарите“ — клон Тано Раде Брусарски (стр. 2)',
  archiveCaption3: 'Родословно дърво на рода „Брусарите“ — клон дядо Цано Радев Брусарски (стр. 3)',
  archiveEmptyBody: 'Все още няма качени страници в архива.',
  archiveCaptionPlaceholder: 'Добавете описание…',

  // about
  aboutLink: 'За автора',
  aboutTitle: 'За автора',
  aboutBody: 'Родословното дърво е създадено и се поддържа от:',

  // multiple trees
  treesTitle: 'Родословни дървета',
  treesPickBody: 'Изберете дърво, което да отворите.',
  treesNone: 'Все още нямате достъп до нито едно дърво. Свържете се със стопанина.',
  treesNoneAdmin: 'Все още няма създадени дървета.',
  treesNew: 'Ново дърво',
  deleteTree: 'Изтрий дървото',
  deleteTreeTitle: 'Изтриване на дърво',
  deleteTreeCta: 'Изтрий завинаги',
  deleteTreeWarn: (name: string) =>
    `„${name}“ ще бъде изтрито заедно с всички хора, снимки и архива в него. Действието е необратимо.`,
  deleteTreeTypeSlug: (slug: string) => `Въведете „${slug}“, за да потвърдите:`,
  backToTrees: 'Към дърветата',
  treeNotFound: 'Дървото не е намерено',
  treeNotFoundBody: 'Няма дърво с този адрес. Може да е преместено или изтрито.',
  treeNoAccess: 'Няма достъп',
  treeNoAccessBody: 'Този акаунт не е поканен в това дърво. Свържете се със стопанина му.',
  createTreeTitle: 'Ново родословно дърво',
  create: 'Създай',
  ctName: 'Име на дървото',
  ctNameRequired: 'Името е задължително.',
  ctSlug: 'Адрес (в URL)',
  ctSlugHelp: 'Само малки латински букви, цифри и тире. Не може да се променя после.',
  ctSlugInvalid: 'Невалиден адрес — само a–z, 0–9 и тире.',
  ctSlugTaken: 'Този адрес вече е зает.',
  ctSubtitle: 'Подзаглавие (по желание)',
  ctMotto: 'Мото (по желание)',
  ctFirstEditor: 'Първи редактор (имейл)',
  ctFirstEditorHelp: 'Този акаунт ще може да редактира новото дърво.',
  ctEditorInvalid: 'Невалиден имейл адрес.',

  // cross-tree partner link (marriage joining two family trees)
  linkFactLabel: 'Съпруг/а в друго дърво',
  linkAction: 'Свържи с друго дърво',
  linkRemove: 'Премахни връзката',
  linkRemoveConfirm: 'Да премахна ли връзката към другото дърво (и от двете страни)?',
  linkTitle: 'Свързване с друго дърво',
  linkConfirm: 'Свържи',
  linkNoTrees: 'Нямате права на редактор в друго дърво, с което да свържете този човек.',
  linkPickTree: 'Изберете другото дърво',
  linkPickPerson: 'Изберете човек от това дърво',
  linkNoPeople: 'В това дърво няма хора.',
  linkFailed: 'Свързването не бе успешно. Нужни са права на редактор и в двете дървета.',
  linkIntro: (name: string) =>
    `Изберете човек от друго дърво, за когото „${name}“ е съпруг или съпруга. Двете дървета остават отделни — създава се само връзка за навигация между тях.`,
  linkPreview: (a: string, b: string, treeName: string) => `${a}  ⚭  ${b} (${treeName})`,
  linkedTreesLabel: 'Свързани дървета',
  combinedView: 'Виж всички свързани дървета',
  combinedTitle: 'Всички свързани дървета',

  // admin: manage per-tree access
  adminAccessTitle: 'Достъп до дърветата',
  adminAccessIntro:
    'За всяко дърво управлявайте кой може да го вижда (наблюдатели) и кой да го редактира (редактори).',
  adminAccessNoTrees: 'Още няма създадени дървета.',
}

export const motto = 'Опознай рода си, за да си горд! Човек без роднини е сам.'

export const relationLabels: Record<RelationType, string> = {
  child: 'Дете',
  father: 'Баща',
  mother: 'Майка',
  wife: 'Съпруга',
  husband: 'Съпруг',
  grandfather: 'Дядо',
  grandmother: 'Баба',
  aunt: 'Леля',
  uncle: 'Вуйчо',
  cousin: 'Братовчед',
  other: 'Друго',
}
