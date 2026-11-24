const routes = new Set(["/", "/home", "/read", "/dashboard", "/ai", "/settings", "/about", "/help", "/contact", "/donate"]);

export function getAssistantPath(value: string): string | null {
  const path = value.split("|", 1)[0].trim().toLowerCase();
  return routes.has(path) ? path : null;
}
