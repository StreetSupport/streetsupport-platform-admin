export interface IRouterLike {
  replace: (href: string) => void;
}

export const NOT_FOUND_ROUTE = '/404';

/**
 * Handle a 404 response from an API call by redirecting to the shared
 * not-found route. Returns true if a redirect was triggered so callers
 * can exit early.
 */
export function redirectToNotFound(
  response: Response,
  router: IRouterLike,
  route: string = NOT_FOUND_ROUTE
): boolean {
  if (response.status === 404) {
    router.replace(route);
    return true;
  }

  return false;
}
