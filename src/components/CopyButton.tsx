import { useState } from 'react';
import { Copy as CopyIcon, CopyCheck as CopyCheckIcon } from "lucide-react";
import { Button } from "@headlessui/react";

export const CopyButton = ({ text, subtle = false }: { text: string, subtle?: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("failed to copy", error);
        }
    };

    const buttonClasses = subtle 
        ? "text-neutral-400 hover:text-neutral-300 dark:text-neutral-500 dark:hover:text-neutral-400 transition-colors opacity-60 hover:opacity-100"
        : "text-neutral-300 hover:text-white transition-colors";

    const iconSize = subtle ? "h-3 w-3" : "h-4";

    return (
        <Button
            onClick={handleCopy}
            className={buttonClasses}
            title="Copy message to clipboard"
        >
            {copied ? (
                <CopyCheckIcon className={iconSize} />
            ) : (
                <CopyIcon className={iconSize} />
            )}
        </Button>
    );
};