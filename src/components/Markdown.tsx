import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const languageMap: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'jsx',
  'ts': 'typescript',
  'tsx': 'tsx',
  'py': 'python',
  'rb': 'ruby',
  'cs': 'csharp',
  'yml': 'yaml',
  'sh': 'shell',
  'md': 'markdown',
  'rs': 'rust',
};

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
            <ul className="list-disc list-inside ml-2" {...props}>
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
    a: ({ node, children, href, ...props }) => {
        let url = href || '';

        if (url && !url.startsWith('http') && !url.startsWith('#')) {
            url = `https://${url}`;
        }
        
        return (
            <a
                className="text-blue-500 hover:underline"
                href={url}
                target="_blank"
                rel="noreferrer noopener"
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
    table: ({ children, ...props }) => {
        return (
            <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse border border-neutral-300 dark:border-neutral-700" {...props}>
                    {children}
                </table>
            </div>
        );
    },
    thead: ({ children, ...props }) => {
        return (
            <thead className="bg-neutral-200 dark:bg-neutral-800" {...props}>
                {children}
            </thead>
        );
    },
    tbody: ({ children, ...props }) => {
        return <tbody {...props}>{children}</tbody>;
    },
    tr: ({ children, ...props }) => {
        return <tr className="border-b border-neutral-300 dark:border-neutral-700" {...props}>{children}</tr>;
    },
    th: ({ children, ...props }) => {
        return <th className="p-2 text-left font-semibold" {...props}>{children}</th>;
    },
    td: ({ children, ...props }) => {
        return <td className="p-2 border-r last:border-r-0 border-neutral-300 dark:border-neutral-700" {...props}>{children}</td>;
    },
    blockquote: ({ children, ...props }) => {
        return (
            <blockquote className="border-l-4 border-neutral-400 dark:border-neutral-600 pl-4 py-1 my-2 italic" {...props}>
                {children}
            </blockquote>
        );
    },
    hr: ({ ...props }) => {
        return <hr className="my-4 border-neutral-300 dark:border-neutral-700" {...props} />;
    },
    img: ({ src, alt, ...props }) => {
        return (
            <img 
                src={src} 
                alt={alt || 'Image'} 
                className="max-h-60 my-2 rounded-md" 
                loading="lazy"
                {...props} 
            />
        );
    },
    code({ children, className, node, ref, ...rest }) {
        const match = /language-(\w+)/.exec(className || "");
        
        if (!match) {
            return (
                <code
                    {...rest}
                    className={`${className || ''} bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono`}
                    children={children}
                />
            );
        }

        let language = match[1].toLowerCase();
        language = languageMap[language] || language;
        
        const text = String(children).replace(/\n$/, "");

        if (language === "markdown" || language === "md") {
            return <Markdown>{text}</Markdown>;
        }

        return (
            <div className="relative my-4">
                <div className="flex justify-between items-center bg-neutral-800 dark:bg-neutral-700 pl-4 pr-2 py-1.5 rounded-t-md text-xs text-neutral-300">
                    <span>{language}</span>
                    <CopyButton text={text} />
                </div>
                <SyntaxHighlighter
                    {...rest}
                    className="rounded-t-none rounded-b-md !mt-0"
                    children={text}
                    PreTag="div"
                    style={vscDarkPlus}
                    language={Object.values(languageMap).includes(language) ? language : 'text'}
                    wrapLines
                    customStyle={{
                        margin: 0,
                        borderRadius: '0 0 6px 6px',
                    }}
                />
            </div>
        );
    },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
    if (!children) return null;
    
    try {
        return (
            <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
                {children}
            </ReactMarkdown>
        );
    } catch (error) {
        console.error("Markdown rendering error:", error);
        return <pre className="whitespace-pre-wrap">{children}</pre>;
    }
};

export const Markdown = memo(
    NonMemoizedMarkdown,
    (prevProps, nextProps) => prevProps.children === nextProps.children,
);