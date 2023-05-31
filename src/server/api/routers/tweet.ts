import { z } from "zod";
import {
  createTRPCRouter,
  // publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  // protectedProdecure means you need to be logged in, in order to do this.
  create: protectedProcedure
    .input(z.object( { content: z.string() } ))
    // mutation allows us to modify data
    // this is an async function which takes in our input, where we pass in some text, we call it content
    // and after that we will have access to our context variable as well
    // this has things like the database and our user information inside of it
    .mutation(async ( { input: { content }, ctx } ) => {
      // we need to make this mutation happen, and we can do that with prisma, which can be accessed on our context
      // we pass the create method an object with the content, and the userId also accessed from our context
      // and we return the result of this database operation
      const tweet = await ctx.prisma.tweet.create( { data: { content, userId: ctx.session.user.id } } )
      // return the tweet
      return tweet;
    })
});
