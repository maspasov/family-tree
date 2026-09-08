import type { RelationType } from '../../model/person'

export const messages = {
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
