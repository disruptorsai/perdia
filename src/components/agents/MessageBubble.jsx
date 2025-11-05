import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Bot } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    const statusConfig = {
        pending: { icon: Clock, color: 'text-slate-400', text: 'Pending' },
        running: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        in_progress: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: 'text-red-500', text: 'Failed' } : 
            { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        success: { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
        error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
    }[status] || { icon: Zap, color: 'text-slate-500', text: '' };
    
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').reverse().join(' ').toLowerCase();
    
    return (
        <div className="mt-2 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                    "hover:bg-slate-50",
                    expanded ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"
                )}
            >
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className="text-slate-700">{formattedName}</span>
                {statusConfig.text && (
                    <span className={cn("text-slate-500", isError && "text-red-600")}>
                        • {statusConfig.text}
                    </span>
                )}
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", 
                        expanded && "rotate-90")} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 space-y-2">
                    {toolCall.arguments_string && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Parameters:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap">
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Result:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MessageBubble({ message, agent, isTyping }) {
    if (isTyping) {
        return (
            <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Bot className="h-4 w-4 text-slate-500" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 bg-white border border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating content...</span>
                    </div>
                </div>
            </div>
        );
    }
    
    const isUser = message.role === 'user';
    
    const renderAsHtml = agent?.name === 'blog_content_writer' && message.role === 'assistant' && message.content;

    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Bot className="h-4 w-4 text-slate-500" />
                </div>
            )}
            <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className={cn(
                        "rounded-2xl px-4 py-2.5",
                        isUser ? "bg-slate-800 text-white" : "bg-white border border-slate-200"
                    )}>
                        {isUser ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                        ) : renderAsHtml ? (
                            <div 
                                className="prose prose-sm max-w-none 
                                    prose-headings:font-bold prose-headings:text-slate-900
                                    prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:leading-tight
                                    prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5 prose-h2:leading-snug
                                    prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
                                    prose-h4:text-base prose-h4:mb-2 prose-h4:mt-3
                                    prose-p:mb-4 prose-p:leading-relaxed prose-p:text-slate-700
                                    prose-ul:my-4 prose-ul:list-disc prose-ul:ml-6
                                    prose-ol:my-4 prose-ol:list-decimal prose-ol:ml-6
                                    prose-li:mb-2 prose-li:leading-relaxed
                                    prose-strong:font-semibold prose-strong:text-slate-900
                                    prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4
                                    prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                    prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-4
                                    prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                                    prose-img:rounded-lg prose-img:my-4"
                                dangerouslySetInnerHTML={{ __html: message.content }} 
                            />
                        ) : (
                            <ReactMarkdown 
                                className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code">
                                                <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto my-2">
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-slate-800 hover:bg-slate-700"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                        toast({ title: 'Code copied' });
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3 text-slate-400" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                                {children}
                                            </code>
                                        );
                                    },
                                    a: ({ children, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
                                    ),
                                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-lg font-semibold my-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-2 border-slate-300 pl-3 my-2 text-slate-600">
                                            {children}
                                        </blockquote>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}
                
                {message.tool_calls?.length > 0 && (
                    <div className="space-y-1">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}
            </div>
            {isUser && (
                 <div className="h-7 w-7 rounded-lg bg-slate-800 text-white flex items-center justify-center mt-0.5 shrink-0">
                    <div className="font-semibold text-xs">U</div>
                </div>
            )}
        </div>
    );
}