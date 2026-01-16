import type { ReactNode } from "react";

export default function Selectable(props: {
  selected: boolean;
  onSelect?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-3 transition",
        props.selected ? "border-white/60 bg-white/5" : "border-white/10",
        props.onSelect ? "cursor-pointer hover:border-white/30" : "",
        props.className || ""
      ].join(" ")}
      onClick={props.onSelect}
    >
      {props.children}
    </div>
  );
}

