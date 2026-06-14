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
        // Return true for APIs to let the middleware function manually return 401 JSON.
        // For pages, return whether a token exists so withAuth can handle standard redirects to /login.
        const isApi = req.nextUrl.pathname.startsWith("/api/chats");
        if (isApi) {
          return true;
        }
        return !!token;
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
