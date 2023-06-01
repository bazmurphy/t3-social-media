import {
  useState,
  useLayoutEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";

// this is a way to dynamically resize the textarea to exactly fit how much text is in it
function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
  if (textArea == null) {
    return;
  }
  textArea.style.height = "0";
  textArea.style.height = `${textArea.scrollHeight}px`;
}

// [*] So to fix this we need to extract the form logic into a separate function just "Form"
// and then make an authentication check on the "NewTweetForm" component

export function NewTweetForm() {
  const session = useSession();
  // if we are not authenticated don't render anything (the form)
  // ie. don't run the useLayoutEffect, because we are never authenticated on the server

  if (session.status !== "authenticated") {
    return null; // null is neccessary for TypeScript
  }
  return <Form />;
}

export function Form() {
  const session = useSession();
  // make a state to store the input
  const [inputValue, setInputValue] = useState("");
  // make a useRef to the text area // later we need to remove the null default value, so we know it is modifiable
  const textAreaRef = useRef<HTMLTextAreaElement>();

  // when you set a ref to a function, it will call the useCallback and pass the textArea in as the actual property
  // as soon as our text area gets added to the page it will call this function and it will update the size
  // this is how to fix the initial on load behaviour
  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaSize(textArea);
    // then take the textAreaRef.current and set it to the textArea
    textAreaRef.current = textArea;
  }, []);

  // create a useEffect that uses the function above to update the text area size using that ref
  // useEffect(() => {
  // updateTextAreaSize(textAreaRef.current);
  // }, [inputValue])

  // ^ this should be useLayoutEffect not useEffect because we are changing the height of something
  useLayoutEffect(() => {
    updateTextAreaSize(textAreaRef.current);
  }, [inputValue]);
  // [*] We get an error:
  // Warning: useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format.
  // This will lead to a mismatch between the initial, non-hydrated UI and the intended UI.
  // To avoid this, useLayoutEffect should only be used in components that render exclusively on the client.
  // See https://reactjs.org/link/uselayouteffect-ssr for common fixes.

  // but there is a problem in that when we first load the page it doesn't work
  // because it doesn't have access this to Ref because it hasn't been defined yet

  // we can now use the tRCP api object from utils/api and then the useMutation hook
  // https://tanstack.com/query/latest/docs/react/guides/mutations
  const createTweet = api.tweet.create.useMutation({
    // we have an onSuccess function in the useMutation() hook
    // we can use it to see if the tweet is being created
    onSuccess: (newTweet) => {
      console.log("createTweet newTweet:", newTweet);
      setInputValue("");
    },
  });

  if (session.status !== "authenticated") {
    // if the user is not authenticated then do not render out the NewTweetForm component
    // because we cannot create a new Tweet
    return null; // returning null is neccessary for TypeScript
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // we call the createTweet function this will create a tweet inside of our database for us
    createTweet.mutate({ content: inputValue });
  }

  // add an onSubmit event handler to the form to hookup the createTweet
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-b px-4 py-2"
    >
      <div className="flex gap-4">
        <ProfileImage src={session.data.user.image} />
        <textarea
          // add the ref here:
          // ref={textAreaRef}
          // because of the above issue with first load we need to use this ref instead (from the useCallback)
          ref={inputRef}
          // iniitalise the height as 0
          style={{ height: 0 }}
          // set the value as the inputValue state
          value={inputValue}
          // onChange update the inputValue state
          onChange={(event) => setInputValue(event.target.value)}
          className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
          placeholder="What's happening?"
        />
      </div>
      <Button className="self-end">Tweet</Button>
    </form>
  );
}
