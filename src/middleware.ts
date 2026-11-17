import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/adminAuth";

/** /admin sits behind the browser's own Basic Auth prompt. No ADMIN_PASSWORD set → nobody gets in. */
export function middleware(req: NextRequest) {
  if (isAdmin(req.headers.get("authorization"))) return NextResponse.next();
  return new NextResponse("Admin only", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="PlayMyList admin"' } });
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
