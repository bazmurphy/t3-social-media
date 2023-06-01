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
      {profile.name}
    </>
  );
};

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
