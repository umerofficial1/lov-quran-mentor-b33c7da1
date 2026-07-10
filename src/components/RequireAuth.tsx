/**
 * Auth gate disabled — login is no longer required anywhere in the app.
 * This component is a pass-through so existing wrappers keep working.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
