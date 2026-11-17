/** Checks a Basic Auth header against ADMIN_USER / ADMIN_PASSWORD. Unset password → always false. */
export function isAdmin(authorization: string | null): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  const user = process.env.ADMIN_USER || "admin";
  const [scheme, encoded] = (authorization || "").split(" ");
  if (!pass || scheme !== "Basic" || !encoded) return false;
  try {
    const decoded = atob(encoded);
    const i = decoded.indexOf(":");
    return decoded.slice(0, i) === user && decoded.slice(i + 1) === pass;
  } catch {
    return false;
  }
}
