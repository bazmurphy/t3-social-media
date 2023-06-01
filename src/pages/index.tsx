import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { NewTweetForm } from "~/components/NewTweetForm";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { api } from "~/utils/api";

// we define some tabs
const TABS = ["Recent", "Following"] as const;

const Home: NextPage = () => {
  // we add a useState for the selected tab
  const [selectedTab, setSelectedTab] =
    useState<(typeof TABS)[number]>("Recent"); // the typing here is saying get each type based on the index

  // we need the session status
  const session = useSession();

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
        {session.status === "authenticated" && (
          // we loop over each of the TABS
          <div className="flex">
            {TABS.map((tab) => {
              return (
                <button
                  key={tab}
                  className={`flex-grow p-2 hover:bg-gray-200 focus-visible:bg-gray-200 ${
                    tab === selectedTab
                      ? "border-b-4 border-b-blue-500 font-bold"
                      : ""
                  }`}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}
      </header>
      <NewTweetForm />
      {selectedTab === "Recent" ? <RecentTweets /> : <FollowingTweets />}
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
      hasMore={tweets.hasNextPage}
      // ?? is to fix typescript error:
      // if tweets.hasNextPage is undefined, it will default to false, satisfying the type requirement of boolean for the hasMore prop.
      fetchNewTweets={tweets.fetchNextPage}
    />
  );
}

// we create a new FollowingTweets Component (that is very similar to RecentTweets)
function FollowingTweets() {
  const tweets = api.tweet.infiniteFeed.useInfiniteQuery(
    // we make make the useInfiniteQuery take some parameters
    { onlyFollowing: true },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  console.log("RecentTweet tweets:", tweets);

  return (
    <InfiniteTweetList
      tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
      isError={tweets.isError}
      isLoading={tweets.isLoading}
      hasMore={tweets.hasNextPage}
      fetchNewTweets={tweets.fetchNextPage}
    />
  );
}

export default Home;
