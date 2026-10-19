# CoffeeMetrics — план проекта

## Контекст
Учебный full-stack проект: аналитический дашборд для сети из трёх кофеен. Прототип — `design/design.png` (в запросе указан `dashboard.png`, но в репозитории файл называется так). Репозиторий пустой, `git init` сделан, remote `origin` → `github.com/ibadildin-edu/PushkarevCoffee`.

Принятые решения:
- **Live-лента** есть, работает через polling (RTK Query `pollingInterval` раз в ~10 с). У заказа есть статус. Пока Live включён, фоновый симулятор на бэкенде создаёт новые заказы.
- **Авторизации нет.**
- **Валюта** ₸ (цены — целые числа в тенге), локаль ru-RU, часовой пояс `Asia/Almaty`. В БД время хранится в `timestamptz`, агрегации считаются `AT TIME ZONE 'Asia/Almaty'`.
- **Фронтенд** ставится через npm.

**Что делаем на этом шаге (после утверждения плана):** `docs/PLAN.md` (этот план), `CLAUDE.md`, `docker-compose.yml`, `.env.example`, `.gitignore` и пустую структуру папок с `.gitkeep`. Бэкенд и фронтенд пишем на следующих шагах.

---

## 1. Структура репозитория
```
.
├── CLAUDE.md
├── docker-compose.yml          # только Postgres 16
├── .env.example                # POSTGRES_*, DATABASE_URL, порты
├── .gitignore
├── design/design.png
├── docs/PLAN.md
├── backend/                    # uv-проект (pyproject.toml + uv.lock появятся на шаге 1)
│   ├── app/
│   │   ├── main.py             # FastAPI app, lifespan, CORS, подключение роутеров
│   │   ├── core/               # config.py (pydantic-settings), timezone/period-хелперы
│   │   ├── db/                 # engine, async_sessionmaker, Base, get_session
│   │   ├── models/             # SQLAlchemy 2.0 модели (Mapped[...])
│   │   ├── schemas/            # Pydantic v2 схемы запросов/ответов
│   │   ├── api/v1/             # роутеры: locations, categories, products, orders, analytics, simulator
│   │   ├── services/           # бизнес-логика и SQL-агрегации (analytics.py, orders.py, simulator.py)
│   │   └── seed/               # генератор данных за 90 дней
│   ├── alembic/ (+ alembic.ini)
│   └── tests/                  # pytest + pytest-asyncio + httpx.AsyncClient
└── frontend/                   # Vite + React + TS
    └── src/
        ├── app/                # store.ts, router.tsx, hooks.ts (typed useAppDispatch/useAppSelector)
        ├── api/                # baseApi.ts (createApi), типы ответов
        ├── features/
        │   ├── filters/        # filtersSlice (период, точка, live)
        │   ├── dashboard/      # api, components, DashboardPage
        │   ├── orders/
        │   ├── menu/
        │   └── locations/
        ├── shared/
        │   ├── ui/             # Card, Badge, Button, Select, Dialog, Table, Pagination, Skeleton
        │   ├── lib/            # format.ts (₸, числа, даты ru-RU), dates.ts
        │   └── layout/         # AppLayout (Sidebar + <Outlet/>)
        └── styles/
```

## 2. Схема БД (PostgreSQL 16)
| Таблица | Поля |
|---|---|
| `locations` | `id` PK, `name` (unique), `slug` (unique), `address`, `opened_at` date, `is_active` bool |
| `categories` | `id` PK, `name` (unique), `slug`, `sort_order` int, `color` (hex для графиков) |
| `products` | `id` PK, `category_id` FK→categories, `name` (unique), `price` int ₸ (CHECK > 0), `is_active` bool, `created_at`, `updated_at` |
| `orders` | `id` PK, `number` int (unique, для отображения «#4863»), `location_id` FK→locations, `created_at` timestamptz, `status` enum `order_status` (`preparing`, `completed`, `cancelled`), `total_amount` int ₸, `items_count` int |
| `order_items` | `id` PK, `order_id` FK→orders ON DELETE CASCADE, `product_id` FK→products ON DELETE RESTRICT, `quantity` int (CHECK > 0), `unit_price` int (цена на момент заказа), `line_total` int |

- Индексы: `orders(location_id, created_at)`, `orders(created_at)`, `orders(status)`, `order_items(order_id)`, `order_items(product_id)`.
- `total_amount` и `items_count` в заказе денормализованы, чтобы агрегации работали быстрее.
- Позицию меню не удаляем физически: «удаление» ставит `is_active = false`, потому что на неё ссылается история заказов.
- В метриках учитываем только `status != 'cancelled'`.
- Одна начальная миграция Alembic (`--autogenerate`, затем проверяем её вручную; enum создаётся явно).

## 3. API (`/api/v1`)
Общие параметры фильтра для аналитики: `date_from`, `date_to` (даты, включительно, по Алматы), `location_id` (необязательный). Пресеты «7/30/90 дней» фронт превращает в даты. Предыдущий период бэкенд считает сам: отрезок той же длины прямо перед текущим.

**Справочники и CRUD**
- `GET /health`
- `GET /locations` — список точек с краткими KPI за последние 30 дней
- `GET /locations/{id}`
- `GET /categories`
- `GET /products?category_id&is_active&search`
- `GET /products/{id}`, `POST /products`, `PATCH /products/{id}`, `DELETE /products/{id}` (soft delete)

**Заказы**
- `GET /orders?date_from&date_to&location_id&status&product_id&min_total&max_total&page=1&page_size=20&sort=-created_at` → `{items, total, page, page_size}`
- `GET /orders/{id}` — вместе с позициями
- `GET /orders/recent?location_id&limit=10` — для Live-ленты. В ответе: последние заказы с краткой строкой позиций + `today: {orders, revenue}`

**Аналитика (`/analytics/...`)**
- `kpi` → `revenue`, `orders`, `avg_check`, `best_product {name, quantity, share}`; у каждого показателя есть `value`, `prev`, `delta_pct`
- `revenue-daily` → `points: [{date, revenue, orders, prev_revenue}]` (прошлый период выровнен по индексу дня) + `avg`, `max {date, value}`
- `top-products?limit=10` → `[{product_id, name, category, quantity, revenue}]`
- `heatmap` → `[{weekday 1–7, hour 7–22, avg_orders}]` (среднее число заказов в час по каждому дню недели периода) + `peak`
- `categories` → `[{category_id, name, color, quantity, revenue, share}]`, `total_quantity`
- `locations-comparison` → `[{location_id, name, revenue, orders, avg_check, delta_pct}]` (параметр `location_id` здесь игнорируется)

**Симулятор (Live)**
- `GET /simulator` → `{enabled}`
- `PUT /simulator {enabled: bool}`. Фоновая asyncio-задача в lifespan каждые несколько секунд создаёт заказы с интенсивностью по текущему часу и переводит `preparing` → `completed` через 2–5 минут.

Агрегации пишем в `services/analytics.py` на SQLAlchemy Core (`func.date_trunc`, `extract('isodow')`, `extract('hour')` по `created_at AT TIME ZONE 'Asia/Almaty'`). Python-циклов по заказам нет.

## 4. Сидирование (`uv run python -m app.seed --days 90 --reset`)
- **Точки** (разный характер и средний чек):
  - «Кампус» — студенты, чек ниже, в выходные заметный спад;
  - «Центр» — в выходные оживлённее, чем в будни;
  - «Бизнес-центр» — самый высокий чек, в выходные почти пусто.
- **Меню:** 4 категории (Кофе, Чай, Выпечка, Десерты), ~25 позиций с реальными ценами в ₸.
- **Число заказов в час** = базовая интенсивность точки × часовой профиль (7–22, пики 8–9 и 12–13, вечерний хвост) × коэффициент дня недели × лёгкий тренд × шум. Внутри часа время заказа случайное. Количество заказов берётся из распределения Пуассона.
- **Корзина:** 1–4 позиции; у кофе вес ~60%. Средний чек точки задаётся числом позиций и долей дорогих напитков и десертов.
- ~2% заказов `cancelled`. Заказы последних минут — `preparing`, остальные — `completed`.
- Генерация детерминированная (`random.Random(42)`). Вставка батчами. Итого ~40–60 тыс. заказов.

## 5. Фронтенд
**Маршруты** (`createBrowserRouter`):
```
/                 AppLayout (Sidebar + <Outlet/>)
  index           DashboardPage
  orders          OrdersPage
  orders/:id      OrderDetailsPage (или drawer поверх списка)
  menu            MenuPage
  locations       LocationsPage
  locations/:id   LocationPage
  *               NotFoundPage
```

**Redux**
- `filtersSlice` — `{period: 7|30|90, locationId: number|null, live: boolean}`. Это глобальные фильтры дашборда, синхронизируем с URL search params.
- `baseApi` (RTK Query, `fetchBaseQuery('/api/v1')`) + `injectEndpoints` в каждой feature. Теги: `Products`, `Orders`, `Locations`, `Analytics`. Мутации меню инвалидируют `Products` и `Analytics`.
- Фильтры и страница таблицы заказов живут в URL search params, отдельный слайс не нужен.

**Компоненты дашборда** (по макету):
- `DashboardHeader` (`PeriodSwitcher`, `LocationSelect`, `LiveToggle`)
- `KpiCard` ×4 (выручка, заказы, средний чек, лучшая позиция; бейдж дельты)
- `RevenueChart` (Recharts `AreaChart` + пунктирная линия прошлого периода)
- `TopProductsList` (горизонтальные бары)
- `CategoryDonut` (`PieChart` с подписью в центре + легенда)
- `LoadHeatmap` (CSS grid 7×16, 5 ступеней цвета)
- `LocationsComparison` (`BarChart`; в макете его нет, ставим под тепловой картой)
- `RecentOrdersFeed` (правая колонка; polling, когда включён Live)

**Остальные экраны:**
- **Заказы:** `OrdersFilters` + `OrdersTable` + `Pagination`.
- **Меню:** `ProductsTable` + `ProductFormDialog` (react-hook-form + zod: имя, категория, цена > 0).
- **Точки:** карточки с KPI, страница точки переиспользует виджеты дашборда с фиксированным `locationId`.

**Тема Tailwind:** кремовый фон, тёмно-коричневый «эспрессо», оранжевый акцент — цвета из макета задаём токенами в конфиге. Шрифт без засечек.

**Vite** проксирует `/api` → `http://localhost:8000`.

## 6. Этапы
0. **Каркас (этот шаг):** PLAN.md, CLAUDE.md, docker-compose, .env.example, .gitignore, папки.
1. **Бэкенд-основа:** `uv init`, зависимости, config, модели, миграция Alembic, CRUD-эндпоинты (locations/categories/products/orders), тесты CRUD.
2. **Сидирование данных.**
3. **Аналитические эндпоинты** + тесты на корректность агрегаций.
4. **Фронтенд-основа:** Vite + TS + Tailwind, роутер с layout, store, baseApi, shared/ui.
5. **Дашборд:** все виджеты + глобальные фильтры.
6. **Экраны** Заказы, Меню, Точки.
7. **Live:** симулятор + polling-лента; полировка (скелетоны, пустые состояния, обработка ошибок).

## 7. Детали шага 0
- `docker-compose.yml`:
  - сервис `db`, образ `postgres:16-alpine`;
  - env из `.env` с дефолтами (`coffee`/`coffee`, БД `coffeemetrics`), порт `${POSTGRES_PORT:-5432}:5432`;
  - named volume `pgdata`, healthcheck `pg_isready`.
- `.env.example`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `DATABASE_URL=postgresql+asyncpg://...`, `TZ_NAME=Asia/Almaty`.
- `.gitignore`: Python (`.venv`, `__pycache__`, `.pytest_cache`, `.ruff_cache`, `.mypy_cache`), Node (`node_modules`, `dist`), `.env`, IDE, OS-файлы.
- `CLAUDE.md`:
  - стек и решения из «Контекста»;
  - команды: `docker compose up -d`, `uv sync`, `uv run alembic upgrade head`, `uv run fastapi dev app/main.py`, `uv run python -m app.seed`, `uv run pytest`, `npm install` / `npm run dev` / `npm run build` / `npm run lint`;
  - соглашения:
    - деньги — целые ₸;
    - время — `timestamptz` UTC, отображение по Алматы;
    - роутер → сервис → БД, без логики в роутерах;
    - типизация везде;
    - ruff + mypy (бэк), ESLint + Prettier (фронт);
    - feature-папки на фронте;
    - RTK Query для всех запросов, без ручного fetch;
    - UI-тексты на русском, код и идентификаторы на английском;
  - ссылка на `docs/PLAN.md` и `design/design.png`.
- Пустые папки с `.gitkeep`: `backend/app/{core,db,models,schemas,api/v1,services,seed}`, `backend/alembic`, `backend/tests`, `frontend/src/{app,api,features/{filters,dashboard,orders,menu,locations},shared/{ui,lib,layout},styles}`, `docs`.

## Проверка шага 0
- `docker compose up -d` → `docker compose ps` показывает `db` в состоянии `healthy`.
- `docker compose exec db psql -U coffee -d coffeemetrics -c "select version();"` возвращает PostgreSQL 16.
- `git status` показывает только ожидаемые файлы, `.env` в git не попадает.
