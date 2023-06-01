import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { Button } from "~/components/Button";
import { useSession } from "next-auth/react";

// Any time we try to access a profile page..
// It will ask have I accessed this page before?
// If not generate the page using all of the information
// pass that information down to the client, and then show us that actual page
// this allows us to use the Server to generate our users name before the page gets sent down to the client
// which means that the title property is going to be in the HTML before it gets to the client
// which is really good for SEO

// the page takes in an id prop.. and the way we get the types for this is a bit confusing...we use a Generic Type
// it is saying that the props that get passed in to this are coming from the return value of the function getStaticProps used below
const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  // we use api object to make a query request to the tRPC server
  const { data: profile } = api.profile.getById.useQuery({ id });

  const tweets = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    // The getNextPageParam and getPreviousPageParam options are available for both determining if there is more data to load and the information to fetch it. This information is supplied as an additional parameter in the query function
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const trpcUtils = api.useContext();

  const toggleFollow = api.profile.toggleFollow.useMutation({
    // we need change the cache to update the followers count
    onSuccess: ({ addedFollow }) => {
      trpcUtils.profile.getById.setData({ id }, (oldData) => {
        // if there is no oldData then return
        if (oldData == null) {
          return;
        }

        const countModifier = addedFollow ? 1 : -1;

        // return the old data with, and update the isFollowing boolean, and followersCount number
        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: oldData.followersCount + countModifier,
        };
      });
    },
  });

  // if the profile is null, then we are on a profile page that doesn't exist
  if (profile == null || profile.name == null) {
    return <ErrorPage statusCode={404} />;
  }

  // unlike all the other pages that are rendering on the client
  // this page is able to get the profile name on the server and send it to the client
  // and since we are using Server Side Generation instead of Server Side Rendering
  // it will cache the page, so the next time we access it, it will be very quick because it's coming directly from the cache
  // so it will not have to run through the hydration a second time
  // if the information we get from the ssg.profile.getById.prefetch changes
  // we will want to re-generate that cached page
  return (
    <>
      <Head>
        <title>{`T3 Social Media - ${profile.name}`}</title>
      </Head>
      <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
        <Link href=".." className="mr-2">
          <IconHoverEffect>
            <VscArrowLeft className="h-6 w-6" />
          </IconHoverEffect>
        </Link>
        {/* flex-shrink-0 means if the page gets smaller the image doesn't change it's size */}
        <ProfileImage src={profile.image} className="flex-shrink-0" />
        <div className="ml-2 flex-grow">
          <h1 className="text-lg font-bold">{profile.name}</h1>
          <div className="text-gray-500">
            {profile.tweetsCount}{" "}
            {getPlural(profile.tweetsCount, "Tweet", "Tweets")} -{" "}
            {profile.followersCount}{" "}
            {getPlural(profile.followersCount, "Follower", "Followers")} -{" "}
            {profile.followsCount} Following
          </div>
        </div>
        <FollowButton
          isFollowing={profile.isFollowing}
          isLoading={toggleFollow.isLoading}
          userId={id}
          onClick={() => toggleFollow.mutate({ userId: id })}
        />
      </header>
      <main>
        <InfiniteTweetList
          // we take the tweets, if there is data, it will give us "pages" and we can map through each one
          tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
          isError={tweets.isError}
          isLoading={tweets.isLoading}
          hasMore={tweets.hasNextPage}
          fetchNewTweets={tweets.fetchNextPage}
        />
      </main>
    </>
  );
};

function FollowButton({
  userId,
  isFollowing,
  isLoading,
  onClick,
}: {
  userId: string;
  isFollowing: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  // check our session
  const session = useSession();

  // if the user is not logged in, or the user is the same as the one logged in (you cannot follow yourself)
  if (session.status !== "authenticated" || session.data.user.id === userId) {
    return null;
  }

  return (
    <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

const pluralRules = new Intl.PluralRules();
function getPlural(number: number, singular: string, plural: string) {
  // give me a singular or a plural version based on the number
  return pluralRules.select(number) === "one" ? singular : plural;
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [], // the paths that we want to generate, an empty array says don't generate any pages by default
    fallback: "blocking", // for whenever you get a request for a page that doesn't exist (a page in our paths), dont send the html until it's done generating
  };
};

// there are a few ways to do this: dynamic user name insertion in the title
// [1] server side render the entire page
// [2] use incremental static site generation
// we will do [2] because the actual information we will be querying doesn't change that often (user's name and image)
// and when it does we can revalidate the page
// so we need to use:
export async function getStaticProps(
  // the id is a dynamic property, we named the file [id].tsx
  context: GetStaticPropsContext<{ id: string }>
) {
  const id = context.params?.id;

  // if we don't have an id, redirect to the main page
  if (id == null) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  // get a server side generation helper
  const ssg = ssgHelper();
  // it allows us to prefetch some data automatically and render it to our page
  // we use the prefetch() method... to get all the data to then statically generate the site
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      id,
      // makes sure we rehydrate everything on the frontend without going out and calling the backend
      trpcState: ssg.dehydrate(),
    },
  };
}

export default ProfilePage;
