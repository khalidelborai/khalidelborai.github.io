"use client";

import { cloneElement, useRef } from "react";
import { CopyButton } from "./copy";

export default function Pre({
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  const codeRef = useRef(null);
  return (
    <pre {...props}>
      <CopyButton Ref={codeRef}></CopyButton>

      {cloneElement(props.children as React.ReactElement, { ref: codeRef })}
    </pre>
  );
}
