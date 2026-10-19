# CoffeeMetrics

Учебный full-stack проект: аналитический дашборд для сети из трёх кофеен.
- План и этапы: [docs/PLAN.md](docs/PLAN.md). Работаем строго по этапам, не забегаем вперёд.
- Макет: [design/design.png](design/design.png).

## Стек
- **БД:** PostgreSQL 16, только в Docker (`docker-compose.yml`). Локально Postgres не ставим.
- **Бэкенд** (`backend/`):
  - Python 3.12, FastAPI;
  - SQLAlchemy 2.0 (async) + asyncpg, Alembic;
  - Pydantic v2 + pydantic-settings;
  - зависимости через **uv**.
- **Фронтенд** (`frontend/`):
  - Vite + React + TypeScript;
  - Redux Toolkit + RTK Query;
  - React Router (вложенные маршруты, layout с `<Outlet/>`);
  - Recharts, react-hook-form + zod, Tailwind CSS;
  - пакетный менеджер **npm**.

## Ключевые решения
- **Авторизации нет.**
- **Деньги** — целые числа в тенге (₸), без копеек и float.
- **Время** хранится в `timestamptz` (UTC). Группировка и отображение — в `Asia/Almaty` (`created_at AT TIME ZONE 'Asia/Almaty'`).
- **Локаль UI** — ru-RU (`Intl.NumberFormat('ru-RU')`, формат «2,9 млн ₸», «1 395 ₸»).
- **Статусы заказа:** `preparing`, `completed`, `cancelled`. В метриках `cancelled` не учитываем.
- **Позиции меню** не удаляем физически, только `is_active = false`.
- **Live** = polling через RTK Query (`pollingInterval` ~10 с) + серверный симулятор новых заказов (`PUT /api/v1/simulator`).
- **Аналитика** считается в SQL (SQLAlchemy Core), без циклов по заказам в Python.

## Команды
```bash
# БД
cp .env.example .env
docker compose up -d            # поднять Postgres
docker compose ps               # db должен быть healthy
docker compose down             # остановить (данные в volume pgdata)
docker compose down -v          # остановить и удалить данные

# Бэкенд (из backend/)
uv sync
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "msg"
uv run python -m app.seed --days 90 --reset
uv run fastapi dev app/main.py  # http://localhost:8000, docs: /docs
uv run pytest
uv run ruff check . && uv run ruff format . && uv run mypy app

# Фронтенд (из frontend/)
npm install
npm run dev                     # http://localhost:5173, /api проксируется на :8000
npm run build
npm run lint
```

## Соглашения по коду
**Общие**
- Код, идентификаторы, имена файлов и коммиты — на английском. Тексты UI — на русском.
- Не добавлять зависимости без необходимости. Новую библиотеку сначала обсудить.

**Бэкенд**
- Слои: `api/v1` (роутеры) → `services` (логика, запросы) → `models`. В роутерах только валидация, вызов сервиса и возврат схемы.
- Все эндпоинты под `/api/v1`, всегда с `response_model`. Схемы запросов и ответов в `schemas/`, отдельно от моделей.
- Модели в стиле SQLAlchemy 2.0: `Mapped[...]` / `mapped_column`. Сессия только async, через `Depends(get_session)`.
- Схему БД меняем только через миграции Alembic. Автогенерированную миграцию проверяем глазами.
- Полная типизация. ruff (lint + format) и mypy должны проходить.
- Списки с пагинацией возвращают `{items, total, page, page_size}`.
- Тесты: pytest + pytest-asyncio + `httpx.AsyncClient`. Для каждого агрегирующего эндпоинта есть тест на известных данных.

**Фронтенд**
- Структура по feature-папкам: `src/features/<feature>/{api.ts, components/, <Feature>Page.tsx}`. Общее лежит в `src/shared/`.
- Все запросы к API — через RTK Query (`baseApi.injectEndpoints`), ручного `fetch`/axios нет. Мутации инвалидируют теги.
- Глобальные фильтры дашборда (период, точка, live) хранятся в `filtersSlice` и синхронизируются с URL. Фильтры таблиц — в URL search params.
- Формы: react-hook-form + zod-схема, тип выводится через `z.infer`.
- Стили только через Tailwind. Цвета — токены темы (по макету), без хардкода hex в компонентах.
- Строгий TypeScript, без `any`. Компоненты функциональные, именованный экспорт.
- Форматирование денег, чисел и дат — только через `src/shared/lib/format.ts`.
