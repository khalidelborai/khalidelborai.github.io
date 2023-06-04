import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";

export default function Home(
    // tag param
    { params }: {
        params: {
            tag: string[];
        };
    }

) {
    return (
        <div className="prose dark:prose-invert">
            
            {allPosts
                .filter((post) => post?.tags?.includes(params.tag[0]))
                .map((post) => (
                    <article key={post._id}>
                        <Link href={post.slug}>
                            <h2>{post.title}</h2>
                        </Link>

                        {post.description && <p>{post.description} </p>}
                        <span className="text-sm text-slate-600 dark:text-slate-400">{post.readingTime}</span>
                    </article>
                ))}
        </div>
    );
}
