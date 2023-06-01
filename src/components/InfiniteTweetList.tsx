import { useSession } from "next-auth/react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import { ProfileImage } from "./ProfileImage";
import { VscHeartFilled, VscHeart } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";

// define the types for Tweet
type Tweet = {
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
};

export function InfiniteTweetList({
  tweets,
  isError,
  isLoading,
  fetchNewTweets,
  hasMore,
}: InfiniteTweetListProps) {
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
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
    );
  }

  return (
    <ul>
      {/* we use an imported library custom component, an add the required props: */}
      {/* dataLength which is the length of our data */}
      {/* next which is the function it calls to get our next piece of data */}
      {/* hasMore which is a boolean if there is more data */}
      {/* loader which is the loading element */}
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={hasMore}
        loader={"Loading..."}
      >
        {tweets.map((tweet) => {
          // we now use the TweetCard component, and spread in the tweet object
          return <TweetCard key={tweet.id} {...tweet} />;
        })}
      </InfiniteScroll>
    </ul>
  );
}

// The Intl object in JavaScript stands for "Internationalization."
// It provides a set of functionalities for formatting and handling internationalization-related tasks, such as formatting dates, numbers, currencies, and handling language-specific string comparisons.
// undefined = the default locale
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

// create a Tweet Card component
function TweetCard({
  id,
  user,
  content,
  createdAt,
  likeCount,
  likedByMe,
}: Tweet) {
  // we get some utility functions so we can refresh our data
  const trcpUtils = api.useContext();

  // the useMutation hook from React Query allows you to define and execute mutation operations, such as creating, updating, or deleting data on a server.
  // It simplifies the process of interacting with an API by handling the request, response, and state management automatically.
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      // [0] this is one way to do it, it invalidates all of the current data and refetches it
      // await trcpUtils.tweet.infiniteFeed.invalidate();

      // [2] we define the updateData function here:
      // this has the exact same type as the 2nd parameter we pass to the function below
      const updateData: Parameters<
        // defining its type
        typeof trcpUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        // if we have nothing in our current data (cache) then return immediately
        if (oldData == null) {
          return;
        }
        // otherwise update our current data (cache) and return the new version
        const countModifier = addedLike ? 1 : -1;
        return {
          ...oldData,
          // map through the pages
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((tweet) => {
                // if the tweet matches the id, then modify the likeCount, and set the likedByMe to the addedLike boolean
                if (tweet.id === id) {
                  return {
                    ...tweet,
                    likeCount: tweet.likeCount + countModifier,
                    likedByMe: addedLike,
                  };
                }
                // otherwise return the tweet in it's original state
                return tweet;
              }),
            };
          }),
        };
      };

      // [1] but we can do it in a better way:
      // we call setInfiniteData, and pass it the parameters, which in our case is an empty object
      // and then we pass it a function updateData which we will define above
      // we will have multiple different ways to call this and we want to update all of them anytime we toggle any like at all
      trcpUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
    },
  });

  // create a function that uses the "toggleLike" method on the "tweet" router
  function handleToggleLike() {
    toggleLike.mutate({ id });
  }

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${user.id}`}>
        <ProfileImage src={user.image} />{" "}
      </Link>
      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          <Link
            href={`/profiles/${user.id}`}
            className="font-bold outline-none hover:underline focus-visible:underline"
          >
            {user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormatter.format(createdAt)}
          </span>
        </div>
        {/* if we have enters or whitespaces in our code all of them will show with "whitespace-pre-wrap" */}
        <p className="whitespace-pre-wrap">{content}</p>
        {/* custom component we make below to deal with the liking of tweets */}
        <HeartButton
          onClick={handleToggleLike}
          isLoading={toggleLike.isLoading}
          likedByMe={likedByMe}
          likeCount={likeCount}
        />
      </div>
    </li>
  );
}

// type the HeartButtonProps
type HeartButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  likedByMe: boolean;
  likeCount: number;
};

// create a HeartButton component
function HeartButton({
  isLoading,
  onClick,
  likedByMe,
  likeCount,
}: HeartButtonProps) {
  // get the session to get the user to see if they are logged in
  const session = useSession();

  // conditional logic for heart icon
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  // if the user is not logged in
  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }

  // if the user is logged in then it should be a clickable button
  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      // "group" => when you need to style an element based on the state of some parent element,
      // mark the parent with the group class, and use group-* modifiers like group-hover to style the target element
      // we use conditional classes for if it is likedByMe or not
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      {/* we build a custom wrapper IconHoverEffect that will apply hover styles to the HeartIcon */}
      <IconHoverEffect red>
        <HeartIcon
          className={`transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
          }`}
        />
      </IconHoverEffect>
      <span>{likeCount}</span>
    </button>
  );
}
