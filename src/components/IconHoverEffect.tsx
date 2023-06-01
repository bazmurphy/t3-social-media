import { type ReactNode } from "react";

// define the types for IconHoverEffectProps
type IconHoverEffectProps = {
  children: ReactNode;
  red?: boolean;
};

// create a component that adds hover background effects and colours
// "group" => when you need to style an element based on the state of some parent element,
// mark the parent with the group class, and use group-* modifiers like group-hover to style the target element
export function IconHoverEffect({
  children,
  red = false,
}: IconHoverEffectProps) {
  const colorClasses = red
    ? "outline-red-400 hover:bg-red-200 group-hover-bg-red-200 group-focus-visible:bg-red-200 focus-visible:bg-red-200"
    : "outline-gray-400 hover:bg-gray-200 group-hover-bg-gray-200 group-focus-visible:bg-gray-200 focus-visible:bg-gray-200";

  return (
    <div
      className={`rounded-full p-2 transition-colors duration-200 ${colorClasses}`}
    >
      {children}
    </div>
  );
}
