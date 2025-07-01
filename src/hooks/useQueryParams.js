import { useLocation } from 'react-router-dom';

/**
 * Custom hook to parse URL query parameters
 */
export function useQueryParams() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

/**
 * Helper function to get specific query parameter
 */
export function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}