import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "./root";
import { createInnerTRPCContext } from "./trpc";
import superjson from "superjson";

export function ssgHelper() {
  // this will be coming from TRPC
  return createServerSideHelpers({
    router: appRouter,
    // to get our context we need to open the trpc.ts file
    // and export the createInnerTRPCContext function
    // and we want to pass it a session of null
    // because if we are doing static site generation we don't have any user information
    ctx: createInnerTRPCContext({ session: null }),
    transformer: superjson,
  });
}

// with this done we have created a trpc helper we can run to generate static sites for us
