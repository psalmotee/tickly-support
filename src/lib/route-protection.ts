// used

import type { AuthSession } from "./auth-client";

export type AppRole = "admin" | "user";

const AUTH_PAGES = new Set(["/", "/login", "/signup"]);

export function checkUserRole(
  session: AuthSession | null,
  requiredRole: AppRole,
): boolean {
  return session?.user.role === requiredRole;
}

export function handleRoleRedirect(session: AuthSession | null): string {
  if (checkUserRole(session, "admin")) {
    return "/admin-dashboard";
  }

  return "/user-dashboard";
}

interface ProtectRouteInput {
  pathname: string;
  session: AuthSession | null;
}

export function protectRoute({
  pathname,
  session,
}: ProtectRouteInput): string | null {
  const isAuthPage = AUTH_PAGES.has(pathname);
  const isAdminPage = pathname.startsWith("/admin-dashboard");

  if (!session && !isAuthPage) {
    return "/login";
  }

  if (session && isAuthPage) {
    return handleRoleRedirect(session);
  }

  if (session && isAdminPage && !checkUserRole(session, "admin")) {
    return "/user-dashboard";
  }

  return null;
}
