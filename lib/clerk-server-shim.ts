export async function auth() {
  return { userId: "demo-user" };
}

export function clerkMiddleware() {
  return function middleware() {
    return undefined;
  };
}
