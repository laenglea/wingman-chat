import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const components: Partial<Components> = {
    pre: ({ children }) => {
        return <>
            {children}
        </>;
    },
    ol: ({ node, children, ...props }) => {
        return (
            <ol className="list-decimal list-inside ml-2" {...props}>
                {children}
            </ol>
        );
    },
    li: ({ node, children, ...props }) => {
        return (
            <li className="py-1" {...props}>
                {children}
            </li>
        );
    },
    ul: ({ node, children, ...props }) => {
        return (
            <ul className="list-decimal list-inside ml-2" {...props}>
                {children}
            </ul>
        );
    },
    strong: ({ node, children, ...props }) => {
        return (
            <span className="font-semibold" {...props}>
                {children}
            </span>
        );
    },
    a: ({ node, children, ...props }) => {
        return (
            <a
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noreferrer"
                {...props}
            >
                {children}
            </a>
        );
    },
    h1: ({ node, children, ...props }) => {
        return (
            <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
                {children}
            </h1>
        );
    },
    h2: ({ node, children, ...props }) => {
        return (
            <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
                {children}
            </h2>
        );
    },
    h3: ({ node, children, ...props }) => {
        return (
            <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
                {children}
            </h3>
        );
    },
    h4: ({ node, children, ...props }) => {
        return (
            <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
                {children}
            </h4>
        );
    },
    h5: ({ node, children, ...props }) => {
        return (
            <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
                {children}
            </h5>
        );
    },
    h6: ({ node, children, ...props }) => {
        return (
            <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
                {children}
            </h6>
        );
    },
    code({ children, className, node, ref, ...rest }) {
        const match = /language-(\w+)/.exec(className || "");

        if (!match) {
            return <code
                {...rest}
                className={`${className}`}
                children={children}
            />;
        }

        const language = match[1]
        const text = String(children).replace(/\n$/, "")

        if (language === "markdown") {
            return <Markdown>{text}</Markdown>;
        }

        return (
            <div className="relative">
                <CopyButton text={text} />
                <SyntaxHighlighter
                    {...rest}
                    className={`${className}`}
                    children={text}
                    PreTag="div"
                    style={vscDarkPlus}
                    language={language}
                />
            </div>
        );
    },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
    return (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
            {children}
        </ReactMarkdown>
    );
};

export const Markdown = memo(
    NonMemoizedMarkdown,
    (prevProps, nextProps) => prevProps.children === nextProps.children,
);