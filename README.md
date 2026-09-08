# Родословно дърво — Брусарите

Интерактивно родословно дърво на рода **„Брусарите“ — клон Тано Раде Брусарски**,
по ръчно нарисуваната схема от 1987 г. на инж. Тодор Танев-Брусарски.

Web приложение: **React + Vite + TypeScript**, диаграма с
[`d3-org-chart`](https://github.com/bumbeishvili/org-chart), вход с **Google**
и база данни **Firebase Firestore**. Хоства се безплатно на **GitHub Pages**.

- 🔒 **Само поканени** — сайтът изисква вход с Google и показва дървото само на
  акаунти от списъците `config/app.editors` или `config/app.viewers`. Всеки
  друг вижда единствено екран за вход (и съобщение „Нямате достъп“, ако влезе
  с непоканен акаунт).
- ✏️ Акаунтите от `editors` могат и да разглеждат, и да редактират. Акаунтите
  от `viewers` могат само да разглеждат (без бутоните за добавяне/редакция/
  изтриване и без качване на снимки).
- 🗺️ Изглед „Карта“ показва адресите на дървото с [Leaflet](https://leafletjs.com/) + OpenStreetMap — безплатно, без API ключ.
- 📅 Изглед „Календар“ показва рождените дни на всички в месечна мрежа, с [FullCalendar](https://fullcalendar.io/) (безплатното MIT ядро — без платени добавки).
- 📤 „Действия“ → „Изтегли календар (.ics)“ сваля рождените дни като файл, готов за внасяне във всяко календарно приложение (Google, Apple, Outlook…) — без акаунт, без API ключ.
- 🇧🇬 Интерфейсът е изцяло на български. Данните — също!

---

## 1. Локална разработка

```bash
yarn install
cp .env.example .env.local     # после попълнете стойностите от Firebase (стъпка 2)
yarn dev                        # http://localhost:5173
```

`yarn build` прави продукционен билд в `dist/`; `yarn preview` го сервира локално.

> Забележка за диаграмата: `d3-org-chart` е дърво с **един родител на възел**.
> Затова `parentId` сочи към **един** роднина по кръвна линия (по подразбиране
> бащата, както е и в оригиналната схема), а съпруг/съпруга се записва като
> текст в полето „Съпруг/а“ и се показва в същата картичка („⚭ Име“).

---

## 2. Firebase (вход + база данни) — еднократна настройка

1. Отидете на <https://console.firebase.google.com> → **Add project**. Може да
   изключите Google Analytics.
2. **Build → Authentication → Get started → Sign-in method →** активирайте
   **Google**. Изберете support email, запазете.
3. **Build → Firestore Database → Create database →** режим **Production**,
   регион по избор (напр. `europe-west`).
4. **Project settings** (зъбното колело) → секцията **Your apps** → иконата
   **`</>`** (Web) → регистрирайте app (без Hosting) → копирайте обекта
   `firebaseConfig`.
5. Попълнете `.env.local` със стойностите:

   | firebaseConfig            | .env.local                             |
   | ------------------------- | -------------------------------------- |
   | `apiKey`                  | `VITE_FIREBASE_API_KEY`                |
   | `authDomain`              | `VITE_FIREBASE_AUTH_DOMAIN`            |
   | `projectId`               | `VITE_FIREBASE_PROJECT_ID`             |
   | `storageBucket`           | `VITE_FIREBASE_STORAGE_BUCKET`         |
   | `messagingSenderId`       | `VITE_FIREBASE_MESSAGING_SENDER_ID`   |
   | `appId`                   | `VITE_FIREBASE_APP_ID`                 |

   > Тези ключове **не са тайна** — те се изпращат към браузъра при всяко
   > Firebase web приложение. Реалната защита са правилата на Firestore.

### 2a. Правила за сигурност (Firestore rules)

Файлът [`firestore.rules`](./firestore.rules) заключва всичко: писане на
дървото само за акаунти от списъка `config/app.editors`; четене — за акаунти
от `editors` **или** `config/app.viewers`. Единствено `config/app` (самите
списъци) остава публично четим, за да може приложението да провери дали
влезлият акаунт е поканен.

Качете правилата по един от двата начина:

- **През конзолата:** Firestore Database → раздел **Rules** → поставете
  съдържанието на `firestore.rules` → **Publish**.
- **През CLI:**
  ```bash
  yarn global add firebase-tools
  firebase login
  firebase use --add            # изберете проекта
  firebase deploy --only firestore:rules
  ```

### 2b. Кой може да влиза (bootstrap на поканените)

Сайтът е **изцяло затворен** за всеки, който не е в този списък — включително
за преглед. В **Firestore Database → Start collection**:

- Collection ID: `config`
- Document ID: `app`
- Поле: `editors` — тип **array** — стойности: имейлите (Google) на поканените
  с право на редакция, напр. `martospasov@gmail.com`, `dayana.r.krusteva@gmail.com`
- Поле (по желание): `viewers` — тип **array** — имейлите на поканените само
  за преглед (без право на редакция), напр. `rodnina@gmail.com`

Добавяте/махате хора по всяко време, като редактирате тези масиви — промяната
важи веднага (без повторно качване), както за екрана за вход, така и за
самите Firestore правила (`firestore.rules` проверява същите списъци).

---

## 3. Начални данни

Дървото стартира празно. За да заредите разчетената част от снимката
(дедо Раде и децата му, децата на дедо Тано):

1. Влезте с Google акаунт, който е в списъка `editors`.
2. Бутон **„Импорт (JSON)“** → **„Зареди началните данни от снимката“** →
   **„Импортирай“**.

Останалите поколения (III–VI от схемата) се добавят през интерфейса
(избирате човек → **„Добави дете“**) или като редактирате
[`src/seed/seedData.ts`](./src/seed/seedData.ts) и импортирате пак — импортът
обновява по `id`, не дублира.

Бутон **„Експорт (JSON)“** сваля цялото дърво като резервно копие.

---

## 4. Публикуване на GitHub Pages (безплатен домейн)

1. Създайте хранилище в GitHub и качете кода:

   ```bash
   git init
   git add .
   git commit -m "Родословно дърво — първоначална версия"
   git branch -M main
   git remote add origin https://github.com/<потребител>/<хранилище>.git
   git push -u origin main
   ```

   > Ако хранилището се казва `<потребител>.github.io`, сайтът ще е на
   > `https://<потребител>.github.io/`. Иначе — на
   > `https://<потребител>.github.io/<хранилище>/`. Workflow-ът сам нагласява
   > `base` пътя според името на хранилището.

2. **Settings → Secrets and variables → Actions → New repository secret** —
   добавете шестте стойности (същите като в `.env.local`):
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

3. **Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

4. Всеки push към `main` пуска [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml),
   който билдва и публикува. Може и ръчно от таб **Actions → Deploy to GitHub Pages → Run workflow**.

5. **Firebase → Authentication → Settings → Authorized domains → Add domain** —
   добавете `<потребител>.github.io` (и `localhost` вече е там за разработка).
   Без това Google входът на живия сайт ще дава грешка `auth/unauthorized-domain`.

---

## 5. Модел на данните (`persons` колекция)

| Поле          | Тип               | Бележка                                             |
| ------------- | ----------------- | -------------------------------------------------- |
| `name`        | string (задълж.)  | Собствено име                                       |
| `patronymic`  | string            | Презиме                                             |
| `surname`     | string            | Фамилия                                             |
| `parentId`    | string \| null    | `id` на родителя (кръвна връзка за дървото); `null` само за началния човек |
| `motherName` / `fatherName` | string | Майка/баща като свободен текст — независимо от `parentId`, дори когато не е свой възел в дървото |
| `spouse`      | string            | Съпруг/а (свободен текст)                           |
| `gender`      | `m` \| `f` \| `unknown` |                                              |
| `birthYear`   | string            | напр. `1901`, `~1860`, `1901?`                      |
| `deathYear`   | string            |                                                    |
| `birthPlace`  | string            | напр. `с. Враняк, Врачанско`                        |
| `address`     | string            | Текущ адрес — геокодира се в `geo` за картата       |
| `email`       | string            | За известяване при добавяне в дървото (по избор)    |
| `geo`         | `{lat,lng}` \| null | Геокодирани координати; `null` изтрива точката (не празен низ — виж коментара в `usePersons.ts`) |
| `birthMonthDay` | string          | `ММ-ДД`, напр. `05-17` — за повтарящото се събитие в .ics календарния файл |
| `note`        | string            | Прякор, занятие, източник…                          |
| `childOrder`  | number            | Подредба между братя/сестри (по-малко = по-напред)  |
| `verified`    | boolean           | `false` = разчитането от снимката е несигурно       |
| `createdAt` / `updatedAt` / `updatedByEmail` | — | попълват се автоматично          |

Диаграмата иска **точно един** корен (запис без `parentId`). Ако по погрешка
има няколко или нито един, приложението добавя временен корен, за да се покаже
дървото все пак.

---

## 6. Структура на проекта

```
src/
  lib/firebase.ts        инициализация на Firebase (Auth + Firestore)
  lib/i18n.ts            всички текстове на български
  lib/geocode.ts         геокодиране на адрес чрез OpenStreetMap Nominatim
  lib/ics.ts             генерира .ics файл с рождените дни (без акаунт)
  auth/AuthContext.tsx   вход с Google, списък редактори, права
  data/usePersons.ts     реалновременна връзка с Firestore + CRUD + импорт
  model/person.ts        типове, валидация, подготовка на данните за диаграмата
  components/
    FamilyChart.tsx      обвивка около d3-org-chart
    FamilyMap.tsx         обвивка около Leaflet (карта с адресите)
    FamilyCalendar.tsx    обвивка около FullCalendar (месечен изглед с рождени дни)
    Toolbar.tsx          лента с търсене, мащаб, изглед дърво/карта/календар, действия, вход
    PersonPanel.tsx      панел с детайли за избрания човек
    PersonForm.tsx       форма за добавяне/редакция
    ImportDialog.tsx     импорт на JSON / начални данни
  seed/seedData.ts       разчетената част от схемата от 1987 г.
firestore.rules          правила за достъп
.github/workflows/deploy.yml  публикуване на GitHub Pages
```

---

## 7. Календар (.ics износ)

**„Действия“ → „Изтегли календар (.ics)“** генерира стандартен `.ics` файл с
по едно повтарящо се годишно събитие за всеки човек с попълнено поле „Рожден
ден (ММ-ДД)“. Файлът се внася в кое да е календарно приложение (Google
Calendar, Apple Calendar, Outlook…) през неговата собствена функция за импорт
на календар — не е нужен Google акаунт, API ключ или настройка в Google Cloud
Console.

---

## 8. Известяване по имейл (EmailJS) — по избор

Когато редактор добави нов човек с попълнено поле „Имейл“, приложението
изпраща известие директно от браузъра — през [EmailJS](https://www.emailjs.com/),
услуга, направена точно за това: статичен сайт, който изпраща имейли без
собствен сървър. Безплатният план (~200 имейла/месец) е напълно достатъчен.

Без настройка приложението просто пропуска изпращането (полето „Имейл“ пак
работи, само известието не се задейства).

1. Регистрирайте се безплатно на [emailjs.com](https://www.emailjs.com/).
2. **Email Services → Add New Service** → свържете имейл акаунт (напр. Gmail) →
   копирайте **Service ID**.
3. **Email Templates → Create New Template** → използвайте следните
   променливи в шаблона (точно с тези имена):
   - `{{to_email}}` — имейлът на добавения човек (към кого се изпраща)
   - `{{to_name}}` — името му
   - `{{tree_name}}` — заглавието на приложението („Родословно дърво“)
   - `{{family_name}}` — подзаглавието („Родът „Брусарите“ — клон Тано Раде Брусарски“)
   - `{{site_url}}` — адресът на живия сайт

   Готов шаблон (Subject + Content, копирай-постави) е даден по-долу в чата
   при настройката. Копирайте **Template ID**.
4. **Account → API Keys** → копирайте **Public Key**.
5. Попълнете `.env.local` (и съответните GitHub Actions secrets за живия
   сайт, ако искате известията да работят и там):

   ```
   VITE_EMAILJS_SERVICE_ID=...
   VITE_EMAILJS_TEMPLATE_ID=...
   VITE_EMAILJS_PUBLIC_KEY=...
   ```

> Публичният ключ е предназначен да се вижда в браузъра — така работи
> EmailJS. Защитата е през лимита на безплатния план на вашия EmailJS акаунт,
> не през пазене на ключа в тайна.

---

## Мото

> „Опознай рода си, за да си горд! Човек без роднини е сам.“
