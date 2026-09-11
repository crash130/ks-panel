export function publicOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? (url.protocol === "https:" ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return `${url.protocol}//${url.host}`;
}

export function redirectUrl(request: Request, path: string): URL {
  return new URL(path, `${publicOrigin(request)}/`);
}
