import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
// import { type Prisma } from "@prisma/client";

export const profileRouter = createTRPCRouter({
  getById: publicProcedure
    // define the input parameters
    .input(z.object({ id: z.string() }))
    // now make a query, taking in the id and the context
    .query(async ({ input: { id }, ctx }) => {
      // get the current user id
      const currentUserId = ctx.session?.user.id;

      // get the profile of
      const profile = await ctx.prisma.user.findUnique({
        where: { id },
        select: {
          name: true,
          image: true,
          // get the counts of followers, follows, and tweets
          _count: { select: { followers: true, follows: true, tweets: true } },
          followers:
            currentUserId == null // determine if this user is being followed by the current user or not
              ? undefined // if a user is not logged it then don't query anything at all and return undefined
              : { where: { id: currentUserId } }, // otherwise query where the id matches the currentUserId
        },
      });

      // if the profile doesnt exist just return
      if (profile == null) {
        return;
      }

      // build the object to return
      return {
        name: profile.name,
        image: profile.image,
        followersCount: profile._count.followers,
        followsCount: profile._count.follows,
        tweetsCount: profile._count.tweets,
        isFollowing: profile.followers.length > 0,
      };
      // we can now use this to generate a static html version of our site
    }),
});
