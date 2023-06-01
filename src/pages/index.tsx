import { type NextPage } from "next";
import { NewTweetForm } from "~/components/NewTweetForm";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
      </header>
      <NewTweetForm />
      <RecentTweets />
    </>
  );
};

function RecentTweets() {
  // we get our tweets from the api using the route we made infiniteFeed
  // and then we use the useInfiniteQuery hook

  const tweets = api.tweet.infiniteFeed.useInfiniteQuery(
    {},
    // whenever i want to get the next piece of data
    // use this nextCursor and pass it up inside of our TRPC Query
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  console.log("RecentTweet tweets:", tweets);

  return (
    <InfiniteTweetList
      // now we can take the tweets, if there is data, it will give us "pages" and we can map through each one
      tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
      isError={tweets.isError}
      isLoading={tweets.isLoading}
      hasMore={tweets.hasNextPage ?? false}
      // ?? is to fix typescript error:
      // if tweets.hasNextPage is undefined, it will default to false, satisfying the type requirement of boolean for the hasMore prop.
      fetchNewTweets={tweets.fetchNextPage}
    />
  );
}

export default Home;
