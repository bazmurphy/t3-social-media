import Image from "next/image";

type ProfileImageProps = {
  // this is how we make an optional property, because if we don't have an image, which is possible, we want to fallback to a default image
  src?: string | null;
  className?: string;
};

export function ProfileImage({ src, className = "" }: ProfileImageProps) {
  return (
    <div
      className={`relative h-12 w-12 overflow-hidden rounded-full ${className}`}
    >
      {/* if we have a user profile image then render a Next Image component */}
      {/* fill will fill the entirety of its parent, and we must make sure to give the container a relative position */}
      {src == null ? null : (
        <Image src={src} alt="Profile Image" quality={100} fill />
      )}
    </div>
  );
}
