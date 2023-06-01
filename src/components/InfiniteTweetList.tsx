import { useSession } from "next-auth/react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import { ProfileImage } from "./ProfileImage";
import { VscHeartFilled, VscHeart } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";

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
        <HeartButton likedByMe={likedByMe} likeCount={likeCount} />
      </div>
    </li>
  );
}

// type the HeartButtonProps
type HeartButtonProps = {
  likedByMe: boolean;
  likeCount: number;
};

// create a HeartButton component
function HeartButton({ likedByMe, likeCount }: HeartButtonProps) {
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
