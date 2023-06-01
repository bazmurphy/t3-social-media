// we import only the "types" from these:
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";

type ButtonProps = {
  // all are optional hence the ?.
  small?: boolean;
  gray?: boolean;
  className?: string;
  // and we need to make sure this button has the same properties as a standard button inside React
  // so we can set the standard properties for example onClick on our custom Button
  // that's what below is for \/
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

// give default values to the props
export function Button({
  small = false,
  gray = false,
  className = "",
  ...props
}: ButtonProps) {
  // if the button size is small, use these classes, otherwise use these:
  const sizeClasses = small ? "px-2 py-1" : "px-4 py-2 font-bold";
  // if the button is gray use these classes, otherwise use these:
  const colorClasses = gray
    ? "bg-gray-400 hover:bg-gray-300 focus-visible:bg-gray-300"
    : "bg-blue-500 hover:bg-blue-400 focus-visible:bg-blue-400";

  // we can now pass in className="" when using the component which will add further classes to the component
  // also notice the {...props} spread at the end
  return (
    <button
      className={`rounded-full text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${colorClasses} ${className}`}
      {...props}
    ></button>
  );
}
