import { useState } from 'react';
import { Copy as CopyIcon, CopyCheck as CopyCheckIcon } from "lucide-react";
import { Button } from "@headlessui/react";

type CopyButtonProps = {
  text: string;
  size?: number;
};

export const CopyButton = ({ text, ...props }: CopyButtonProps) => {
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

    const buttonClasses = "text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 p-1";
    
    // Simple size mapping
    const sizeClasses = {
        2: "h-2 w-2",
        3: "h-3 w-3", 
        4: "h-4 w-4",
        5: "h-5 w-5",
        6: "h-6 w-6"
    } as const;

    const iconClasses = sizeClasses[(props.size ?? 4) as keyof typeof sizeClasses] || "h-4 w-4";

    return (
        <Button
            onClick={handleCopy}
            className={buttonClasses}
            title="Copy message to clipboard"
        >
            {copied ? (
                <CopyCheckIcon className={iconClasses} />
            ) : (
                <CopyIcon className={iconClasses} />
            )}
        </Button>
    );
};