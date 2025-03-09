import { useState } from 'react';
import { Copy as CopyIcon, CopyCheck as CopyCheckIcon } from "lucide-react";

export const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="text-neutral-300 hover:text-white transition-colors"
            title="Copy code to clipboard"
        >
            {copied ? (
                <CopyCheckIcon className="h-4" />
            ) : (
                <CopyIcon className="h-4" />
            )}
        </button>
    );
};