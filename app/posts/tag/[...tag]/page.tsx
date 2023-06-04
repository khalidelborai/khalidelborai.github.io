import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";

interface TagsProps {
    params: {
        tag: string[];
    };
}

export async function generateStaticParams(): Promise<TagsProps["params"][]> {
    const tags = allPosts.flatMap((post) => post.tags ?? []);
    let uniqueTags: string[] = [];
    tags.forEach((tag) => {
        if (!uniqueTags.includes(tag)) {
            uniqueTags.push(tag);
        }
    });
    return uniqueTags.map((tag) => ({
        tag: [tag],
    }));
}

export default function Tags(
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
