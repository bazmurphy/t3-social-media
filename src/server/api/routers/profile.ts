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

  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input: { userId }, ctx }) => {
      const currentUserId = ctx.session.user.id;

      // make a prisma call to the user table
      // and find the first one where the id is the userId
      // to see if some of the followers have the id (the currentUserId)
      // So we get a user with that particular userId if they are already being followed by us
      const existingFollow = await ctx.prisma.user.findFirst({
        where: { id: userId, followers: { some: { id: currentUserId } } },
      });

      let addedFollow;

      // if the follower does not exist then add one, otherwise remove one
      if (existingFollow == null) {
        // we don't have a followers table, so we need to update the user itself
        await ctx.prisma.user.update({
          // get the user
          where: { id: userId },
          // the "connect" keyword is used to create a relationship between two related records in a database. Used when you want to associate one record with another through a foreign key relationship.
          data: { followers: { connect: { id: currentUserId } } },
        });

        addedFollow = true;
      } else {
        // we do the same thing here, except DISCONNECT
        await ctx.prisma.user.update({
          where: { id: userId },
          // The "disconnect" keyword in Prisma is used to remove an existing relationship between two related records. Used when you want to dissociate one record from another in a foreign key relationship.
          data: { followers: { disconnect: { id: currentUserId } } },
        });

        addedFollow = false;
      }

      // The reason we are adding this extra step is because we statically generated the "Followers" count
      // so if we don't do any revalidation it will always give the user a 0 follower count
      // even if they have a 100 followers, if the first time the page was generated they had 0 followers it will always return that HTML with 0 followers and always have to re-update
      // So if we do some revalidation here, we say the old version is no longer valid, re-update it with the new version
      // We will need to do that everytime they create a tweet, or everytime they are followed or unfollowed.

      // REVALIDATION
      // this takes a path that we want to revalidate
      // void at the start means don't wait for this to finish at all
      // anytime that someone has been followed, first revalidate the page of the person that is being followed
      void ctx.revalidateSSG?.(`/profiles/${userId}`);
      // and also revalidate the page of the person that is following
      void ctx.revalidateSSG?.(`/profiles/${currentUserId}`);
      // to update both of those counts

      // then return the addedFollow as an Object
      return { addedFollow };
    }),
});
