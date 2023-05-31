import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({

  infiniteFeed: publicProcedure // you do not neccessarily need to be logged in to do this
    .input(z.object({
      // we have a limit (which is optional)
      limit: z.number().optional(),
      // we have a cursor for pagination, with an id and createdAt field (which is optional)
      cursor: z.object({ id: z.string(), createdAt: z.date()}).optional()
      })
      // and then we run a query
    ).query(async ({ input: { limit = 10, cursor }, ctx }) => {

      // to find tweets you have already liked we need to get the current user
      const currentUserId = ctx.session?.user.id

      const data = await ctx.prisma.tweet.findMany({
        // we are using Cursor Based Pagination
        // a cursor is a unique identifier
        // every element has some unique identifier to it
        // they will be sequential like id's that go 1,2,3,5 they are unique
        // you pass along the id of the element you want to start with at
        // in this case the cursor is where we want to start in the list
        // and we take however many we want plus 1,
        // the reason for the plus 1 is that will give us the next item we start with, the last item, the one that we added
        // createdAt is not neccessarily unique, if two people post at the exact same millisecond they will have the same createdAt
        // so we make the cursor A COMBINATION of the createdAt as well as the id (see above)
        // the id is only used when the two createdAt are the exact same time
        // we need to say that our id and createdAt are UNIQUE so we can make this work, we need to modify prisma to do this
        // we add set up a uniqueness constraint between our createdAt and our id

        // take is how many we want to get
        take: limit + 1,
        // if our cursor is set, we pass in our cursor, otherwise pass in undefined
        // we created the uniqueness constraint so we can use { createdAt_id: cursor }
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        // orderby tweets newest to oldest, and by id
        orderBy: [ { createdAt: "desc"}, { id: "desc"} ],
        // we are saying, give me the 10 most recent tweets
        // it runs the query
        // the cursor is passed as blank to start, so it is passed undefined
        // and our limit is 10 so it will take the 11 most recent tweets
        // we will look at the 11th one, get the createdAt and the id and we will pass that down
        // so everytime you run this query, use that 11th tweet using the createdAt and id
        // and START from that tweet (so we give a start point)
        // and we order everything by createdAt
        // and the only reason we also have id is in the case where the two tweets were createdAt the same exact time
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: { select: { likes: true }},
          likes: currentUserId == null ? false : { where: { userId: currentUserId }},
          user: {
            select: { name: true, id: true, image: true }
          },
        }
      })

      // using cursor based pagination it means that if people add new Tweets inbetween us changing pages
      // it will not mess that query up to get the next 10 (because of the now updated list)
      // it will keep paginating correctly irrespesctive of those new entries

      let nextCursor: typeof cursor | undefined;

      // this means that if the length of the array is greater than our limit,
      // it means there are more tweets to get, so we have a place to set our Cursor
      if (data.length > limit ) {
        // take the last element from the array
        // set that elements unique identifier as our next cursor
        // so when we do this next query we start from this element right here \/ and continue onwards
        const nextItem = data.pop()
        if (nextItem != null) {
          nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
        }
      }

      // we return the tweets which is a slightly adjusted version of the data object above to be easier to use on the frontend
      // and also the nextCursor
      return { tweets : data.map(tweet => {
        return {
          id: tweet.id,
          content: tweet.content,
          createdAt: tweet.createdAt,
          likeCount: tweet._count.likes,
          user: tweet.user,
          // we take the tweet likes array and if the length is > 0 that means you have currently liked this tweet
          likedByMe: tweet.likes?.length > 0,
        }
      }), nextCursor }
    }),


  create: protectedProcedure // protectedProdecure means you need to be logged in, in order to do this.
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
