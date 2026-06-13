import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isApi = req.nextUrl.pathname.startsWith("/api/chats");
    if (isApi && !req.nextauth.token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // We always return true here so the middleware function above executes
        // and we can manually return 401 JSON for APIs, while allowing standard
        // pages to proceed (and then we handle dashboard redirects).
        // Wait, if we return true, then for /dashboard unauthenticated users
        // it won't redirect to /login automatically!
        // So instead:
        const isApi = req.nextUrl.pathname.startsWith("/api/chats");
        if (isApi) {
          return true; // Let the middleware function return 401
        }
        return !!token; // For pages, return false if no token to trigger redirect
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/chats/:path*"],
};
