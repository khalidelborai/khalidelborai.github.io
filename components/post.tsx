import { Post } from "@/.contentlayer/generated";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function PostCard({ post }: {
    post: Post
}) {
    return <>
        <Card
            key={post._id}
            className="shadow-none bg-transparent border-none "
        >
            <CardHeader>
                <CardTitle
                    className="dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300"
                >
                    <Link href={post.slug}>
                        {post.title}
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>{post.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex flex-row gap-2 self-start">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    {post.readingTime}
                </span>
                {
                    post?.tags && (
                        <div className="flex flex-row gap-2 ">
                            {
                                post?.tags.map((tag) => (
                                    <Link
                                        href={`/posts/tag/${tag}`}
                                        key={
                                            tag
                                        }>
                                        <Badge>
                                            {tag}
                                        </Badge>
                                    </Link>
                                ))
                            }
                        </div>
                    )
                }
                {
                    post?.categories && (
                        <div className="flex flex-row gap-2">
                            Categories:
                            {
                                post?.categories.map((category) => (
                                    <Link className="text-sm text-slate-600 dark:text-slate-400 rounded-md border-b-2 p-1 border-blue-200"
                                        href={`/posts/category/${category}`}
                                        key={
                                            category
                                        }>
                                        {category}
                                    </Link>
                                ))
                            }
                        </div>
                    )
                }
            </CardFooter>

        </Card>
        <Separator className="bg-gray-400 w-[50%] self-center" />
    </>
}