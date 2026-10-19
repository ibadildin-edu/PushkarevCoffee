import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { filtersChanged, selectFilters, type FiltersState } from './filtersSlice';
import { hasFilterParams, parseFilters, sameFilters, writeFilters } from './urlFilters';

/**
 * Global dashboard filters, kept in filtersSlice and mirrored to the URL
 * (?period=30&location=2&live=1).
 * - URL with filter params wins (shared links, back/forward).
 * - URL without them (e.g. sidebar link to "/") gets the current store values written in,
 *   so filters survive navigation between pages.
 */
export function useDashboardFilters(): [FiltersState, (patch: Partial<FiltersState>) => void] {
  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!hasFilterParams(searchParams)) {
      setSearchParams((prev) => writeFilters(prev, filters), { replace: true });
      return;
    }
    const fromUrl = parseFilters(searchParams);
    if (!sameFilters(fromUrl, filters)) dispatch(filtersChanged(fromUrl));
  }, [searchParams, filters, dispatch, setSearchParams]);

  // Changes go through the URL only; the effect above copies them into the store.
  // Dispatching here too would race with the router's transition and briefly revert the store.
  const update = useCallback(
    (patch: Partial<FiltersState>) => {
      setSearchParams((prev) => writeFilters(prev, { ...parseFilters(prev), ...patch }), {
        replace: true,
      });
    },
    [setSearchParams],
  );

  return [filters, update];
}
