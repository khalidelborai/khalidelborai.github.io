import { allPosts } from "@/.contentlayer/generated";
import PostCard from "@/components/post";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Khalid Elborai - Home",
  description: "Khalid Elborai's personal blog",
};

export default function Home() {
  return (
    <div className="flex flex-col gap-2">
      {allPosts.map((post) => (
        <PostCard post={post} key={post._id} />
      ))}
    </div>
  );
}
