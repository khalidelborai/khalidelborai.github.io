"use client";

import { useState } from "react";

export const CopyButton = ({
    Ref,
}: {
    Ref: React.MutableRefObject<HTMLElement | null>;
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const copy = async () => {
        const text = Ref?.current?.innerText;
        await navigator.clipboard.writeText(text || "");
        setIsCopied(true);

        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };


    return (
        <div className="relative ">
            {isCopied ? (
                <div className="inline-flex absolute top-0 end-0">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        onClick={copy}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Copied
                </div>
            ) : (
                <svg
                    onClick={copy}
                    className="w-8 h-8 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer absolute top-0 end-0"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"></path>
                </svg>
            )}
        </div>
    );
};
