import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function SideNav() {
  // get the session from next auth
  const session = useSession();
  // get the user from the session
  // if we are logged in there will be a user
  // if not there will not no user
  const user = session.data?.user;

  return (
    <nav className="sticky top-0 px-2 py-4">
      <ul className="flex flex-col items-start gap-2 whitespace-nowrap">
        <li>
          <Link href="/">Home</Link>
        </li>
        {/* if the user exists then we render the profile link */}
        {user != null && (
          <li>
            <Link href={`/profiles/${user.id}`}>Profile</Link>
          </li>
        )}
        {/* handling for Login / Logout Links */}
        {user == null ? (
          <li>
            {/* onClick run the next auth signOut method, also void is for TypeScript to say we don't care about the return */}
            <button onClick={() => void signIn()}>Log In</button>
          </li>
        ) : (
          <li>
            <button onClick={() => void signOut()}>Log Out</button>
          </li>
        )}
      </ul>
    </nav>
  );
}
