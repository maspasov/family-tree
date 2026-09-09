import type { messages as bgMessages } from './bg'
import type { RelationType } from '../../model/person'

export const messages: typeof bgMessages = {
  appTitle: 'Stammbaum',
  appSubtitle: 'Ein Online-Stammbaum für Ihre Familie',

  // auth
  signIn: 'Mit Google anmelden',
  signOut: 'Abmelden',
  signedInAs: 'Angemeldet als',
  editorBadge: 'Bearbeiter',
  viewerBadge: 'Betrachter',
  notEditorHint:
    'Dieses Konto hat keine Bearbeitungsrechte. Wenden Sie sich an den Verwalter des Stammbaums, um hinzugefügt zu werden.',

  // roles admin page
  rolesMenuLabel: 'Rollen',
  rolesTitle: 'Rollen & Zugriff',
  rolesIntro:
    'Verwalten Sie, wer Zugriff auf den Stammbaum hat. Bearbeiter können ansehen und bearbeiten; Betrachter nur ansehen.',
  rolesEditors: 'Bearbeiter',
  rolesViewers: 'Betrachter',
  rolesEmptyEditors: 'Keine Bearbeiter.',
  rolesEmptyViewers: 'Keine Betrachter.',
  rolesAddPlaceholder: 'email@example.com',
  rolesAddButton: 'Hinzufügen',
  rolesRemove: 'Entfernen',
  rolesInvalidEmail: 'Ungültige E-Mail-Adresse.',
  rolesDuplicate: 'Diese E-Mail ist bereits auf der Liste.',
  rolesLastEditorError: 'Mindestens ein Bearbeiter muss verbleiben.',
  rolesSelfRemoveConfirm: 'Sie entfernen sich selbst von den Bearbeitern. Fortfahren?',

  // access gate (shown before the tree; only invited accounts get past it)
  gateBody:
    'Der Zugang ist nur für eingeladene Familienmitglieder möglich. Melden Sie sich mit Google an, um fortzufahren.',
  restrictedTitle: 'Kein Zugang',
  restrictedBody: (email: string) =>
    `Das Konto „${email}“ wurde nicht zu diesem Stammbaum eingeladen. Wenn Sie glauben, dass Sie Zugang haben sollten, wenden Sie sich an den Verwalter des Stammbaums.`,
  tryAnotherAccount: 'Abmelden (anderes Konto versuchen)',

  // toolbar
  search: 'Person suchen…',
  fit: 'An Bildschirm anpassen',
  expandAll: 'Alle ausklappen',
  collapseAll: 'Alle einklappen',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  exportPng: 'Als PNG herunterladen',
  exportJson: 'Export (JSON)',
  importJson: 'Import (JSON)',
  actions: 'Aktionen',
  addRoot: 'Startperson hinzufügen',
  addPerson: 'Person hinzufügen',
  viewTree: 'Baum',
  viewMap: 'Karte',
  viewCalendar: 'Kalender',
  viewArchive: 'Archiv',
  mapEmptyTitle: 'Noch keine Adressen',
  mapEmptyBody:
    'Fügen Sie mindestens einer Person eine Adresse hinzu (Standort-Symbol im Formular), damit Punkte auf der Karte erscheinen.',
  mapLocateMe: 'Meinen Standort anzeigen',
  mapYouAreHere: 'Sie sind hier',
  mapLocateDenied: 'Der Browser hat den Zugriff auf Ihren Standort verweigert.',
  mapLocateError: 'Ihr Standort konnte nicht ermittelt werden.',
  calendarEmptyTitle: 'Noch keine Geburtstage',
  calendarEmptyBody:
    'Fügen Sie mindestens einer Person im Bearbeitungsformular einen „Geburtstag (MM-TT)“ hinzu, damit Termine im Kalender erscheinen.',
  menuLabel: 'Menü',
  darkMode: 'Dunkles Design',
  lightMode: 'Helles Design',
  language: 'Sprache',
  layoutDown: '⬇ abwärts',
  layoutUp: '⬆ aufwärts',
  layoutDownMenu: 'Abwärts ausklappen',
  layoutUpMenu: 'Aufwärts ausklappen',

  // Calendar export (.ics — no account, works with any calendar app)
  calendarExport: 'Kalender herunterladen (.ics)',
  icsNoBirthdays: 'Niemand hat einen Geburtstag (MM-TT) eingetragen. Fügen Sie mindestens einen im Bearbeitungsformular hinzu.',

  // person panel
  close: 'Schließen',
  born: 'Geboren',
  died: 'Gestorben',
  birthPlace: 'Geburtsort',
  address: 'Adresse',
  email: 'E-Mail',
  photos: 'Fotos',
  addPhoto: 'Foto hinzufügen',
  removePhoto: 'Foto entfernen',
  photoUploading: 'Wird hochgeladen…',
  spouse: 'Ehepartner/in',
  note: 'Notiz',
  parent: 'Verwandter (Elternteil)',
  mother: 'Mutter',
  father: 'Vater',
  relation: 'Verwandtschaftsverhältnis',
  relationConnector: 'von',
  children: 'Kinder',
  unverified: 'Unbestätigt — die Lesart aus dem Foto ist unsicher.',
  edit: 'Bearbeiten',
  addChild: 'Kind hinzufügen',
  deletePerson: 'Löschen',

  // form
  formAddTitle: 'Neue Person',
  formEditTitle: 'Person bearbeiten',
  fName: 'Vorname',
  fPatronymic: 'Vatersname',
  fSurname: 'Nachname',
  fNameEnSection: 'Name in lateinischer Schrift (optional)',
  fNameEn: 'Vorname (EN)',
  fPatronymicEn: 'Vatersname (EN)',
  fSurnameEn: 'Nachname (EN)',
  fMother: 'Mutter',
  fFather: 'Vater',
  fRelationType: 'Verwandtschaftsverhältnis',
  noRelation: '— keine Angabe —',
  fRelationTo: 'In Bezug auf wen',
  fRelationCustomLabel: 'Bezeichnung der Beziehung',
  fRelationCustomLabelPlaceholder: 'z. B. Pate',
  fRelationToHelpFather: 'Die ausgewählte Person wird zum Kind der neuen Person — siehe Warnung unten.',
  fRelationToHelpSpouse: 'Wird als Ehe-Verknüpfung auf der Karte der ausgewählten Person angezeigt.',
  fRelationToHelpLabelOnly: 'Nur beschreibend — ändert nicht die Platzierung im Baum.',
  fRelationFatherWarning: (name: string) =>
    `Beim Speichern wird „${name}“ zum Kind der neuen Person (das Feld „Kind von“ unten betrifft nur die Platzierung der neuen Person, nicht die von „${name}“).`,
  fGender: 'Geschlecht',
  gMale: 'Männlich',
  gFemale: 'Weiblich',
  gUnknown: 'Nicht angegeben',
  fBirthYear: 'Geburtsjahr',
  fDeathYear: 'Todesjahr',
  fBirthMonthDay: 'Geburtstag (MM-TT)',
  fBirthPlace: 'Geburtsort',
  fAddress: 'Adresse (für die Karte)',
  fEmail: 'E-Mail',
  notifySent: (email: string) => `E-Mail an ${email} gesendet.`,
  notifyFailed: (email: string) => `E-Mail an ${email} konnte nicht gesendet werden.`,
  locate: 'Koordinaten suchen',
  locating: 'Suche…',
  locateFound: 'Koordinaten gefunden.',
  locateNotFound: 'Adresse nicht gefunden. Versuchen Sie eine genauere Adresse.',
  locateError: 'Fehler bei der Adresssuche.',
  addressChangedWarning:
    'Die Adresse wurde seit der letzten Suche geändert — klicken Sie auf das Standort-Symbol, um die Koordinaten zu aktualisieren.',
  clearPin: 'Koordinaten entfernen',
  clear: 'Löschen',
  fSpouse: 'Ehepartner/in',
  fParent: 'Kind von',
  fChildOrder: 'Reihenfolge unter Geschwistern',
  fNote: 'Notiz',
  fVerified: 'Angaben sind bestätigt',
  noParent: '— keine (Startperson) —',
  save: 'Speichern',
  cancel: 'Abbrechen',
  saving: 'Wird gespeichert…',
  discardEditConfirm: 'Sie haben ungespeicherte Änderungen. Verwerfen?',

  // add-person wizard
  back: 'Zurück',
  next: 'Weiter',
  optional: 'optional',
  yes: 'Ja',
  no: 'Nein',
  wizStepOf: (n: number, total: number) => `Schritt ${n} von ${total}`,
  wizRelTitle: 'Wie ist die neue Person mit dem Baum verwandt?',
  wizRelPickAnchor: 'Wählen Sie eine Person, die schon im Baum ist',
  wizRelChild: (name: string) => `Kind von ${name}`,
  wizRelSpouse: (name: string) => `Ehepartner/in von ${name}`,
  wizRelParent: (name: string) => `Elternteil von ${name}`,
  wizNameTitle: 'Wie heißt die neue Person?',
  wizDetailsTitle: 'Ein paar weitere Angaben',
  wizDetailsHint: 'Alles optional — Sie können einfach auf „Weiter“ tippen.',
  wizAlive: 'Lebt diese Person noch?',
  wizReviewTitle: 'Prüfen und speichern',
  wizReviewLine: (name: string, rel: string) => `Sie fügen ${name} hinzu — ${rel}.`,
  wizPhraseChildOf: (name: string) => `Kind von ${name}`,
  wizPhraseSpouseOf: (name: string) => `Ehepartner/in von ${name}`,
  wizPhraseParentOf: (name: string) => `Elternteil von ${name}`,
  wizPhraseFirst: 'die erste Person im Baum',

  // delete
  deleteTitle: 'Person löschen',
  deleteConfirm: (name: string) =>
    `„${name}“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  deleteBlockedHasChildren: (name: string, n: number) =>
    `„${name}“ hat ${n} Nachkommen im Baum. Verschieben oder löschen Sie diese zuerst.`,
  confirmYes: 'Ja, löschen',

  // import
  importTitle: 'Daten importieren',
  importHint:
    'Fügen Sie ein JSON-Array von Personen ein oder laden Sie die Ausgangsdaten aus dem Foto. ' +
    'Der Import fügt hinzu/überschreibt anhand der id und löscht nie vorhandene Einträge.',
  importLoadSeed: 'Ausgangsdaten aus dem Foto laden',
  importRun: 'Importieren',
  importDone: (n: number) => `Fertig. ${n} Einträge gespeichert.`,
  importBadJson: 'Ungültiges JSON.',

  // misc
  loading: 'Wird geladen…',
  emptyTreeTitle: 'Der Baum ist leer',
  emptyTreeBody:
    'Melden Sie sich als Bearbeiter an und klicken Sie auf „Startperson hinzufügen“, ' +
    'oder nutzen Sie „Import“, um die Ausgangsdaten zu laden.',
  configMissingTitle: 'Firebase ist nicht konfiguriert',
  configMissingBody:
    'Kopieren Sie .env.example nach .env.local und tragen Sie die Werte aus der ' +
    'Firebase-Konsole ein. Siehe README.md.',
  errorPrefix: 'Fehler',

  // org-chart card (raw HTML, outside React — see FamilyChart.tsx/FamilyMap.tsx)
  synthRootLabel: 'Stammbaum',
  noName: 'Ohne Namen',
  unverifiedFlagTitle: 'Unbestätigt',
  quickLinkEditTitle: 'Bearbeiten',
  quickLinkMapTitle: 'Auf der Karte ansehen',
  quickLinkCalendarTitle: 'Im Kalender ansehen',
  quickLinkDeleteTitle: 'Löschen',
  peopleAtAddress: (n: number) => `${n} Personen an dieser Adresse`,

  // archive view
  archiveTitle: 'Familienarchiv',
  archiveIntro: 'Die Original-Seiten von 1987, auf denen dieser Stammbaum basiert.',
  archiveCaption1: '„Kurzer Abriss“ — geschrieben von Dimitar, Enkel von Großvater Tsano, 9. Dez. 1987.',
  archiveCaption2: 'Stammbaum der Familie Brusarite — Zweig Tano Rade Brusarski (S. 2)',
  archiveCaption3: 'Stammbaum der Familie Brusarite — Zweig Großvater Tsano Radev Brusarski (S. 3)',
  archiveEmptyBody: 'Noch keine Archivseiten hochgeladen.',
  archiveCaptionPlaceholder: 'Beschreibung hinzufügen…',

  // about
  aboutLink: 'Über den Autor',
  aboutTitle: 'Über den Autor',
  aboutBody: 'Dieser Stammbaum wurde erstellt und wird gepflegt von:',

  // multiple trees
  treesTitle: 'Stammbäume',
  treesPickBody: 'Wählen Sie einen Stammbaum zum Öffnen.',
  treesNone: 'Sie haben noch keinen Zugriff auf einen Stammbaum. Wenden Sie sich an den Verwalter.',
  treesNoneAdmin: 'Noch keine Stammbäume erstellt.',
  treesNew: 'Neuer Stammbaum',
  deleteTree: 'Stammbaum löschen',
  deleteTreeTitle: 'Stammbaum löschen',
  deleteTreeCta: 'Endgültig löschen',
  deleteTreeWarn: (name: string) =>
    `„${name}“ wird mit allen Personen, Fotos und Archivseiten darin gelöscht. Das kann nicht rückgängig gemacht werden.`,
  deleteTreeTypeSlug: (slug: string) => `Geben Sie „${slug}“ zur Bestätigung ein:`,
  backToTrees: 'Zu den Stammbäumen',
  treeNotFound: 'Stammbaum nicht gefunden',
  treeNotFoundBody: 'Unter dieser Adresse gibt es keinen Stammbaum. Er wurde evtl. verschoben oder gelöscht.',
  treeNoAccess: 'Kein Zugriff',
  treeNoAccessBody: 'Dieses Konto wurde nicht zu diesem Stammbaum eingeladen. Wenden Sie sich an den Verwalter.',
  createTreeTitle: 'Neuer Stammbaum',
  create: 'Erstellen',
  ctName: 'Name des Stammbaums',
  ctNameRequired: 'Ein Name ist erforderlich.',
  ctSlug: 'Adresse (in der URL)',
  ctSlugHelp: 'Nur Kleinbuchstaben, Ziffern und Bindestriche. Später nicht änderbar.',
  ctSlugInvalid: 'Ungültige Adresse — nur a–z, 0–9 und Bindestriche.',
  ctSlugTaken: 'Diese Adresse ist bereits vergeben.',
  ctSubtitle: 'Untertitel (optional)',
  ctMotto: 'Motto (optional)',
  ctFirstEditor: 'Erster Bearbeiter (E-Mail)',
  ctFirstEditorHelp: 'Dieses Konto kann den neuen Stammbaum bearbeiten.',
  ctEditorInvalid: 'Ungültige E-Mail-Adresse.',

  // cross-tree partner link (marriage joining two family trees)
  linkFactLabel: 'Ehepartner/in in einem anderen Baum',
  linkAction: 'Mit anderem Baum verbinden',
  linkRemove: 'Verknüpfung entfernen',
  linkRemoveConfirm: 'Die Verknüpfung zum anderen Baum entfernen (auf beiden Seiten)?',
  linkTitle: 'Mit anderem Baum verbinden',
  linkConfirm: 'Verbinden',
  linkNoTrees: 'Sie haben in keinem anderen Baum Bearbeitungsrechte, um diese Person zu verknüpfen.',
  linkPickTree: 'Wählen Sie den anderen Baum',
  linkPickPerson: 'Wählen Sie eine Person in diesem Baum',
  linkNoPeople: 'Keine Personen in diesem Baum.',
  linkFailed: 'Verknüpfen fehlgeschlagen. In beiden Bäumen sind Bearbeitungsrechte nötig.',
  linkIntro: (name: string) =>
    `Wählen Sie eine Person aus einem anderen Baum, mit der „${name}“ verheiratet ist. Die beiden Bäume bleiben getrennt — es entsteht nur eine Verknüpfung zum Wechseln zwischen ihnen.`,
  linkPreview: (a: string, b: string, treeName: string) => `${a}  ⚭  ${b} (${treeName})`,
  linkedTreesLabel: 'Verknüpfte Bäume',
  combinedView: 'Alle verknüpften Bäume ansehen',
  combinedTitle: 'Alle verknüpften Bäume',
}

export const motto = 'Kenne deine Familie, damit du stolz sein kannst! Ein Mensch ohne Verwandte ist allein.'

export const relationLabels: Record<RelationType, string> = {
  child: 'Kind',
  father: 'Vater',
  mother: 'Mutter',
  wife: 'Ehefrau',
  husband: 'Ehemann',
  grandfather: 'Großvater',
  grandmother: 'Großmutter',
  aunt: 'Tante',
  uncle: 'Onkel',
  cousin: 'Cousin/Cousine',
  other: 'Sonstiges',
}
