import { useMDXComponent } from "next-contentlayer/hooks";
import Image from "next/image";
import React from "react";
import Pre from "./pre";

// ImageLoader for exporting to static HTML
export function imageLoader({ src, _width, _quality }: any) {
  return `${src}`;
}
function RoundedImage(props: React.ComponentPropsWithoutRef<typeof Image>) {
  return <Image className="rounded-lg" {...props} alt={props.alt} loader={
    imageLoader
  } />;
}

const components = {
  Image: RoundedImage,
  pre: Pre,
};

interface MdxProps {
  code: string;
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code);

  return <Component components={components} />;
}
