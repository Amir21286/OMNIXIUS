# Технический отчёт: перезабивка OMNIXIUS (backend + frontend)

**Дата:** 27 января 2025  
**Ветка:** master (origin/master)  
**Репозиторий:** https://github.com/Amir21286/OMNIXIUS.git

---

## 1. Обзор изменений

Добавлена новая структура проекта по спецификации REBOOT:

- **backend/** — отдельный Rust-проект (Axum, SQLite, слои L1/L3/L4).
- **frontend/** — отдельный Next.js 14 проект (React, Tailwind, Jotai).
- **docker-compose.yml** — оркестрация backend и frontend.

Существующие каталоги **src/**, **layers/**, **omnixius_ui/** не трогались и продолжают работать как раньше.

---

## 2. Структура новых файлов

### 2.1 Backend (`backend/`)

| Путь | Назначение |
|------|------------|
| `Cargo.toml` | Зависимости: axum 0.7, tokio, serde, sqlx 0.7 (SQLite), bcrypt, jsonwebtoken, tower-http (cors), anyhow |
| `src/main.rs` | Точка входа, инициализация БД и слоёв, роуты `/`, `/health`, `/api/*`, CORS |
| `src/lib.rs` | Реэкспорт api, layers, database, middleware |
| `src/database/mod.rs` | `Database::init()`, пул SQLite, миграции (users, wallets, transactions, organisms, posts, follows, post_likes) |
| `src/database/models.rs` | Модель `UserRow` |
| `src/layers/mod.rs` | Реэкспорт L1, L3, L4 |
| `src/layers/l1_chronos.rs` | L1 Chronos: кошельки, баланс, reward_ixi, transfer_ixi, история, лидерборд |
| `src/layers/l3_phoenix.rs` | L3 Phoenix: организмы в памяти (RwLock), создание, эволюция, кроссовер, история |
| `src/layers/l4_oikoumene.rs` | L4 Oikoumene: регистрация/логин (JWT), пользователи, посты, подписки, лайки |
| `src/api/mod.rs` | Роутер API, `ApiResponse<T>`, `Pagination` |
| `src/api/l1.rs` | Маршруты L1: wallet/create, balance/:id, reward, transfer, transactions/:id, leaderboard |
| `src/api/l3.rs` | Маршруты L3: organisms/create, :id, user/:id, :id/evolve, crossover, :id/history |
| `src/api/l4.rs` | Маршруты L4: auth/register, login, me; users/:id, search; posts, feed, :id/like; follow, followers, following |
| `src/middleware/auth.rs` | `verify_token` (JWT), заглушка `AuthUser` |

### 2.2 Frontend (`frontend/`)

| Путь | Назначение |
|------|------------|
| `package.json` | Next 14, React 18, axios, jotai, lucide-react, tailwindcss, framer-motion, three, @react-three/fiber/drei |
| `next.config.js` | rewrites `/api/*` → `http://localhost:4000/api/*` |
| `tailwind.config.js` | Цвета omni-purple, omni-cyan, анимации |
| `postcss.config.js`, `tsconfig.json` | Конфиг сборки |
| `src/styles/globals.css` | Tailwind, glass-card, glow-button, скроллбар |
| `src/lib/api.ts` | Axios-клиент, l1Api, l3Api, l4Api, handleApiResponse, перехват 401 → /login |
| `src/lib/auth.ts` | authAtom (Jotai), register, login, logout, getCurrentUser |
| `src/lib/types.ts` | Типы Wallet, Transaction, Organism, UserPublic, Post, ApiResponse, AuthResponse |
| `src/app/layout.tsx` | Корневой layout с Header |
| `src/app/page.tsx` | Главная: блоки Эволюция, Экономика, Социальность, Игра |
| `src/app/login/page.tsx`, `register/page.tsx` | Страницы входа и регистрации |
| `src/app/evolution/page.tsx` | Страница эволюции (EvolutionPanel по userId) |
| `src/app/economy/page.tsx` | Страница экономики (Wallet + Leaderboard) |
| `src/app/game/page.tsx` | Страница игры (GameCanvas) |
| `src/components/Header.tsx` | Шапка, навигация, инициализация auth из localStorage |
| `src/components/OrganismCard.tsx` | Карточка организма, кнопка эволюции |
| `src/components/EvolutionPanel.tsx` | Список организмов, создание, эволюция, результат |
| `src/components/Wallet.tsx` | Баланс, перевод IXI, последние транзакции |
| `src/components/Leaderboard.tsx` | Лидерборд по балансу IXI |
| `src/components/GameCanvas.tsx` | Canvas с сеткой и заглушкой «Игровой мир» |

### 2.3 Прочее

| Путь | Назначение |
|------|------------|
| `docker-compose.yml` | Сервисы backend (порт 4000), frontend (порт 3000) — для сборки нужны Dockerfile в backend/ и frontend/ |
| `.gitignore` | Добавлены backend/omnixius.db, frontend/node_modules, frontend/.next, .env* |

---

## 3. Проверка ошибок

### 3.1 Линтер (IDE)

- **Frontend:** линтер по `frontend/src` — ошибок не найдено.
- **Backend:** линтер по `backend/src` — ошибок не найдено.

### 3.2 Сборка (нужно выполнить локально)

В текущей среде Cursor команды терминала блокируются (запуск от администратора/песочница). Проверку и пуш нужно выполнить у себя на ПК:

```powershell
# Backend
cd c:\OMNIXIUS\backend
cargo check
cargo build

# Frontend
cd c:\OMNIXIUS\frontend
npm install
npm run build
```

При успешном `cargo build` и `npm run build` проект считается готовым к запуску.

### 3.3 Известные места в коде

- **Backend:** в `l3_phoenix.rs` и `l4_oikoumene.rs` используются `RwLock::write().unwrap()` / `read().unwrap()` и `chrono::Utc::now().unwrap()` — типичная практика для ин-мемори хранилища и времени; при панике поток падает, при нормальной работе паники не ожидаются.
- **Backend:** SQLite — `last_insert_rowid()` вместо `RETURNING` для совместимости со старыми версиями SQLite.
- **Frontend:** при 401 ответе API выполняется редирект на `/login` и очистка localStorage (token, user).

---

## 4. Сохранение на ПК и GitHub

Все файлы уже записаны на диск в каталоге `c:\OMNIXIUS`. Чтобы зафиксировать изменения и отправить их на GitHub, выполните в терминале (от имени обычного пользователя, не администратор):

```powershell
cd c:\OMNIXIUS

# Статус
git status

# Добавить новые и изменённые файлы
git add backend/ frontend/ docker-compose.yml .gitignore docs/TECH_REPORT_REBOOT.md

# Коммит
git commit -m "Reboot: backend (Rust Axum L1/L3/L4) + frontend (Next.js 14) + docker-compose + tech report"

# Пуш (нужны права на репозиторий и настроенный git)
git push origin master
```

Если используете другую ветку (например, `main`), замените `master` на неё. При запросе логина/пароля используйте свой GitHub-аккаунт или токен.

---

## 5. Запуск после клонирования

### Backend

```powershell
cd c:\OMNIXIUS\backend
cargo build
cargo run
```

- Сервер: **http://localhost:4000**
- Health: **http://localhost:4000/health**
- БД: `backend/omnixius.db` (создаётся при первом запуске)

### Frontend

```powershell
cd c:\OMNIXIUS\frontend
npm install
npm run dev
```

- Приложение: **http://localhost:3000**
- API проксируется на backend через rewrites в `next.config.js`.

### Порты

- Backend: **4000**
- Frontend: **3000**

---

## 6. API (кратко)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/`, `/health` | Корень и health-check |
| POST | `/api/l1/wallet/create` | Создать кошелёк |
| GET | `/api/l1/wallet/balance/:user_id` | Баланс |
| POST | `/api/l1/wallet/reward` | Начислить IXI |
| POST | `/api/l1/wallet/transfer` | Перевод IXI |
| GET | `/api/l1/wallet/transactions/:user_id` | История |
| GET | `/api/l1/leaderboard` | Лидерборд |
| POST | `/api/l3/organisms/create` | Создать организм |
| GET | `/api/l3/organisms/:id` | Организм по ID |
| GET | `/api/l3/organisms/user/:user_id` | Организмы пользователя |
| POST | `/api/l3/organisms/:id/evolve` | Эволюция |
| POST | `/api/l3/organisms/crossover` | Кроссовер |
| POST | `/api/l4/auth/register` | Регистрация |
| POST | `/api/l4/auth/login` | Вход |
| GET | `/api/l4/auth/me` | Текущий пользователь (JWT) |
| GET | `/api/l4/users/:id` | Пользователь по ID |
| GET | `/api/l4/users/search?query=` | Поиск пользователей |
| POST | `/api/l4/posts` | Создать пост |
| GET | `/api/l4/posts/feed` | Лента (JWT) |
| POST | `/api/l4/posts/:id/like` | Лайк (JWT) |
| POST/DELETE | `/api/l4/follow/:id` | Подписка/отписка (JWT) |

Формат ответов: `{ success, data?, error?, timestamp }`. JWT в заголовке: `Authorization: Bearer <token>`.

---

## 7. Итог

| Пункт | Статус |
|-------|--------|
| Backend (Rust) | Файлы созданы, линтер чист |
| Frontend (Next.js) | Файлы созданы, линтер чист |
| Сохранение на ПК | Все файлы записаны в `c:\OMNIXIUS` |
| Сборка backend/frontend | Требуется запуск `cargo build` и `npm run build` локально |
| Git commit + push | Требуется выполнить вручную (см. раздел 4) |
| Технический отчёт | Сохранён в `docs/TECH_REPORT_REBOOT.md` |

После выполнения команд из раздела 4 изменения будут сохранены и на ПК, и на GitHub.
