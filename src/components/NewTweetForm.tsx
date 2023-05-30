import { Button } from "./Button"

export function NewTweetForm () {
  return (
    <form className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex gap-4">
        {/* <ProfileImage src="#url" /> */}
        <textarea className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none" placeholder="What's happening?"/>
      </div>
      <Button className="self-end">Tweet</Button>
    </form>
  )
}