import { allPosts } from "@/.contentlayer/generated";
import PostCard from "@/components/post";


export default function Home() {
  return (
    <div className="flex flex-col gap-2">
      {allPosts.map((post) => (
        <PostCard post={post} key={post._id} />
      ))}
    </div>
  );
}
