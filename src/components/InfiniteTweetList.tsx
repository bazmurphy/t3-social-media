import InfiniteScroll from "react-infinite-scroll-component";

// define the types for Tweet
type Tweet =  {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; image: string | null; name: string | null };
};

// define the types for InfiniteTweetListProps
type InfiniteTweetListProps = {
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  fetchNewTweets: () => Promise<unknown>;
  tweets?: Tweet[];
}

export function InfiniteTweetList ({ tweets, isError, isLoading, fetchNewTweets, hasMore }: InfiniteTweetListProps) {
  if (isLoading) {
    return <h1>Loading...</h1>;
  }
  if (isError) {
    return <h1>Error...</h1>;
  }
  if (tweets == null) {
    return null;
  }
  if (tweets == null || tweets.length === 0) {
    return <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
  }

  return <ul>
    {/* we use an imported library custom component, an add the required props: */}
    {/* dataLength which is the length of our data */}
    {/* next which is the function it calls to get our next piece of data */}
    {/* hasMore which is a boolean if there is more data */}
    {/* loader which is the loading element */}
    <InfiniteScroll dataLength={tweets.length} next={fetchNewTweets} hasMore={hasMore} loader={"Loading..."}>
      {tweets.map(tweet => {
        return <div key={tweet.id}>{tweet.content}</div>
      })}
    </InfiniteScroll>
    </ul>
}