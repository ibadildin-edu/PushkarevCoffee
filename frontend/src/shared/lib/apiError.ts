import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export type ApiError = FetchBaseQueryError | SerializedError | undefined;

function isFetchError(error: ApiError): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function errorStatus(error: ApiError): number | undefined {
  if (!isFetchError(error)) return undefined;
  if (typeof error.status === 'number') return error.status;
  return 'originalStatus' in error ? error.originalStatus : undefined;
}

export function isNotFound(error: ApiError): boolean {
  return errorStatus(error) === 404;
}

/** FastAPI returns {detail: string} or {detail: [{msg}]} for validation errors. */
function readDetail(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('detail' in data)) return undefined;
  const { detail } = data;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: unknown) =>
        typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : '',
      )
      .filter(Boolean);
    return messages.length ? messages.join('; ') : undefined;
  }
  return undefined;
}

/** Human-readable Russian message for any RTK Query error. */
export function getErrorMessage(error: ApiError): string {
  if (!error) return 'Неизвестная ошибка.';
  if (!isFetchError(error)) return error.message ?? 'Неизвестная ошибка.';

  if (error.status === 'FETCH_ERROR') {
    return 'Нет связи с сервером. Проверьте подключение к сети.';
  }
  if (error.status === 'TIMEOUT_ERROR') return 'Сервер слишком долго не отвечает.';

  const status = errorStatus(error);
  const detail = readDetail(error.data);
  if (status === 404) return detail ?? 'Запрошенные данные не найдены.';
  if (status !== undefined && status >= 500) {
    return detail
      ? `Ошибка сервера: ${detail}`
      : 'Сервер недоступен. Убедитесь, что бэкенд запущен на http://localhost:8000.';
  }
  return detail ?? `Не удалось загрузить данные (код ${status ?? '—'}).`;
}
