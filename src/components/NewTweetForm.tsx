import { useSession } from "next-auth/react"
import { Button } from "./Button"
import { ProfileImage } from "./ProfileImage"

export function NewTweetForm () {

  const session = useSession();

  if (session.status !== "authenticated") {
    // if the user is not authenticated then do not render out the NewTweetForm component
    // because we cannot create a new Tweet
    return;
  }

  return (
    <form className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex gap-4">
        <ProfileImage src={session.data.user.image} />
        <textarea className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none" placeholder="What's happening?"/>
      </div>
      <Button className="self-end">Tweet</Button>
    </form>
  )
}