import { fetchAuthSession } from "aws-amplify/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { runWithAmplifyServerContext } from "./utils/amplifyServerUtils";

export async function middleware(request: NextRequest) {
  const orgin = request.headers.get("origin");
  const response = NextResponse.next();
  let isAdmin = false;

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  response.headers.set("Access-Control-Allow-Headers", "*");
  response.headers.set("Access-Control-Max-age", "86400");

  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec);
        isAdmin =
          (
            session.tokens?.idToken?.payload["cognito:groups"] as string[]
          )?.[0] === "admin";

        if (isAdmin) {
          console.log("isAdmin", isAdmin);
        }

        return session;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });

  if (request.url === "/admin") {
    if (isAdmin) {
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authenticated && request.url !== "/admin") {
    return response;
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/"],
};
