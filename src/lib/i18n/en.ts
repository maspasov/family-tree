import type { messages as bgMessages } from './bg'
import type { RelationType } from '../../model/person'

export const messages: typeof bgMessages = {
  appTitle: 'Family Tree',
  appSubtitle: 'The Brusarite family — Tano Rade Brusarski branch',

  // auth
  signIn: 'Sign in with Google',
  signOut: 'Sign out',
  signedInAs: 'Signed in as',
  editorBadge: 'editor',
  viewerBadge: 'viewer',
  notEditorHint:
    "This account doesn't have edit access. Contact the tree's owner to be added.",

  // access gate (shown before the tree; only invited accounts get past it)
  gateBody:
    'Access is limited to invited family members. Sign in with Google to continue.',
  restrictedTitle: 'No access',
  restrictedBody: (email: string) =>
    `The account "${email}" hasn't been invited to this family tree. If you think you should have access, contact the tree's owner.`,
  tryAnotherAccount: 'Sign out (try another account)',

  // toolbar
  search: 'Search for a person…',
  fit: 'Fit to screen',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  exportPng: 'Download as PNG',
  exportJson: 'Export (JSON)',
  importJson: 'Import (JSON)',
  actions: 'Actions',
  addRoot: 'Add starting person',
  addPerson: 'Add person',
  viewTree: 'Tree',
  viewMap: 'Map',
  viewCalendar: 'Calendar',
  viewArchive: 'Archive',
  mapEmptyTitle: 'No addresses yet',
  mapEmptyBody:
    'Add an address to at least one person (the locate button in the form) for pins to appear on the map.',
  calendarEmptyTitle: 'No birthdays yet',
  calendarEmptyBody:
    'Add a "Birthday (MM-DD)" to at least one person in the edit form for events to appear on the calendar.',
  menuLabel: 'Menu',
  darkMode: 'Dark theme',
  lightMode: 'Light theme',
  language: 'Language',
  layoutDown: '⬇ downward',
  layoutUp: '⬆ upward',
  layoutDownMenu: 'Expand downward',
  layoutUpMenu: 'Expand upward',

  // Calendar export (.ics — no account, works with any calendar app)
  calendarExport: 'Download calendar (.ics)',
  icsNoBirthdays: 'No one has a birthday (MM-DD) set yet. Add at least one in the edit form.',

  // person panel
  close: 'Close',
  born: 'Born',
  died: 'Died',
  birthPlace: 'Birthplace',
  address: 'Address',
  email: 'Email',
  photos: 'Photos',
  addPhoto: 'Add photo',
  removePhoto: 'Remove photo',
  photoUploading: 'Uploading…',
  spouse: 'Spouse',
  note: 'Note',
  parent: 'Relative (parent)',
  mother: 'Mother',
  father: 'Father',
  relation: 'Family relation',
  relationConnector: 'of',
  children: 'Children',
  unverified: 'Unverified — the reading from the photo is uncertain.',
  edit: 'Edit',
  addChild: 'Add child',
  deletePerson: 'Delete',

  // form
  formAddTitle: 'New person',
  formEditTitle: 'Edit person',
  fName: 'First name',
  fPatronymic: 'Patronymic',
  fSurname: 'Surname',
  fNameEnSection: 'Latin-script name (optional)',
  fNameEn: 'First name (EN)',
  fPatronymicEn: 'Patronymic (EN)',
  fSurnameEn: 'Surname (EN)',
  fMother: 'Mother',
  fFather: 'Father',
  fRelationType: 'Family relation',
  noRelation: '— no relation specified —',
  fRelationTo: 'Relative to whom',
  fRelationCustomLabel: 'Relation name',
  fRelationCustomLabelPlaceholder: 'e.g. Godfather',
  fGender: 'Gender',
  gMale: 'Male',
  gFemale: 'Female',
  gUnknown: 'Not specified',
  fBirthYear: 'Birth year',
  fDeathYear: 'Death year',
  fBirthMonthDay: 'Birthday (MM-DD)',
  fBirthPlace: 'Birthplace',
  fAddress: 'Address (for the map)',
  fEmail: 'Email',
  notifySent: (email: string) => `Email sent to ${email}.`,
  notifyFailed: (email: string) => `Failed to send email to ${email}.`,
  locate: 'Find coordinates',
  locating: 'Searching…',
  locateFound: 'Coordinates found.',
  locateNotFound: 'Address not found. Try a more specific address.',
  locateError: 'Error while looking up the address.',
  addressChangedWarning:
    'The address changed since the last search — click the locate icon to update the coordinates.',
  clearPin: 'Remove coordinates',
  fSpouse: 'Spouse',
  fParent: 'Child of',
  fChildOrder: 'Order among siblings',
  fNote: 'Note',
  fVerified: 'Data is verified',
  noParent: '— none (starting person) —',
  save: 'Save',
  cancel: 'Cancel',
  saving: 'Saving…',

  // delete
  deleteTitle: 'Delete person',
  deleteConfirm: (name: string) =>
    `Delete "${name}"? This action cannot be undone.`,
  deleteBlockedHasChildren: (name: string, n: number) =>
    `"${name}" has ${n} descendant(s) in the tree. Move or delete them first.`,
  confirmYes: 'Yes, delete',

  // import
  importTitle: 'Import data',
  importHint:
    'Paste a JSON array of people, or load the starting data from the photo. ' +
    'Import adds/overwrites by id and never deletes existing records.',
  importLoadSeed: 'Load the starting data from the photo',
  importRun: 'Import',
  importDone: (n: number) => `Done. ${n} record(s) saved.`,
  importBadJson: 'Invalid JSON.',

  // misc
  loading: 'Loading…',
  emptyTreeTitle: 'The tree is empty',
  emptyTreeBody:
    'Sign in as an editor and click "Add starting person", ' +
    'or use "Import" to load the starting data.',
  configMissingTitle: 'Firebase is not configured',
  configMissingBody:
    'Copy .env.example to .env.local and fill in the values from the ' +
    'Firebase console. See README.md.',
  errorPrefix: 'Error',

  // org-chart card (raw HTML, outside React — see FamilyChart.tsx/FamilyMap.tsx)
  synthRootLabel: 'Family tree',
  noName: 'No name',
  unverifiedFlagTitle: 'Unverified',
  quickLinkEditTitle: 'Edit',
  quickLinkMapTitle: 'View on map',
  quickLinkCalendarTitle: 'View in calendar',
  quickLinkDeleteTitle: 'Delete',
  peopleAtAddress: (n: number) => `${n} people at this address`,

  // archive view
  archiveTitle: 'Family archive',
  archiveIntro: 'The original 1987 pages this family tree was built from.',
  archiveCaption1: '"Brief essay" — written by Dimitar, grandson of grandfather Tsano, 9 Dec 1987.',
  archiveCaption2: 'Family tree of the Brusarite family — Tano Rade Brusarski branch (p. 2)',
  archiveCaption3: 'Family tree of the Brusarite family — grandfather Tsano Radev Brusarski branch (p. 3)',
  archiveEmptyBody: 'No archive pages uploaded yet.',
  archiveCaptionPlaceholder: 'Add a caption…',

  // about
  aboutLink: 'About the creator',
  aboutTitle: 'About the creator',
  aboutBody: 'This family tree was built and is maintained by:',
}

export const motto = 'Know your family, and be proud of it! A person without kin is alone.'

export const relationLabels: Record<RelationType, string> = {
  child: 'Child',
  father: 'Father',
  mother: 'Mother',
  wife: 'Wife',
  husband: 'Husband',
  grandfather: 'Grandfather',
  grandmother: 'Grandmother',
  aunt: 'Aunt',
  uncle: 'Uncle',
  cousin: 'Cousin',
  other: 'Other',
}
