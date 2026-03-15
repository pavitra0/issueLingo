'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Languages, Clock, ArrowRightLeft, AlertCircle, MoreVertical, Smile } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { toast } from 'sonner';

interface IssueCommentCardProps {
    item: {
        author: string;
        avatarUrl: string;
        body: string;
        title?: string;
        authorAssociation?: string;
        createdAt?: string;
    };
    isMainBody?: boolean;
    targetLanguage: string;
}

export default function IssueCommentCard({ item, isMainBody = false, targetLanguage }: IssueCommentCardProps) {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
    const [isShowingTranslation, setIsShowingTranslation] = useState(false);

    const [selectionTranslation, setSelectionTranslation] = useState<{
        original: string,
        translated: string,
        isLoading: boolean,
        position: { x: number, y: number } | null
    } | null>(null);

    const proseRef = useRef<HTMLDivElement>(null);

    // Clear cached translations if the target language changes
    useEffect(() => {
        setTranslatedText(null);
        setTranslatedTitle(null);
        setIsShowingTranslation(false);
        setSelectionTranslation(null);
    }, [targetLanguage]);

    // Calculate reading time purely based on word count
    const wordCount = item.body.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const handleTranslateToggle = async () => {
        if (translatedText) {
            setIsShowingTranslation(!isShowingTranslation);
            return;
        }

        setIsTranslating(true);
        try {
            const promises = [
                fetch('/api/translate-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: item.body, targetLanguage }) }).then(res => res.json())
            ];

            if (item.title) {
                promises.push(fetch('/api/translate-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: item.title, targetLanguage }) }).then(res => res.json()));
            }

            const results = await Promise.all(promises);

            setTranslatedText(results[0].translatedText);
            if (item.title && results[1]) {
                setTranslatedTitle(results[1].translatedText);
            }

            setIsShowingTranslation(true);
            toast.success('Message translated!');
        } catch (e) {
            toast.error('Failed to translate this message.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            if (selectionTranslation && !selectionTranslation.isLoading && selectionTranslation.translated) {
                // Keep it showing if we have a translation and it's not loading
            } else {
                setSelectionTranslation(null);
            }
            return;
        }

        const text = selection.toString().trim();
        if (!text) return;

        // If it's the same text as current translation, don't reset unless it was hidden
        if (text === selectionTranslation?.original && selectionTranslation) return;

        // Get bounding rect for positioning the popover near the selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position the popover above the selection
        // We use rect.top (viewport-relative) because the popover is 'fixed'
        setSelectionTranslation({
            original: text,
            translated: '',
            isLoading: false, // Initially false because we show the "Translate" button first
            position: { x: rect.left + rect.width / 2, y: rect.top }
        });
    };

    const performSelectionTranslation = async () => {
        if (!selectionTranslation?.original) return;

        const text = selectionTranslation.original;
        
        setSelectionTranslation(prev => prev ? { ...prev, isLoading: true } : null);

        try {
            const response = await fetch('/api/translate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLanguage })
            });

            if (!response.ok) throw new Error('Failed to translate selection');

            const data = await response.json();
            
            setSelectionTranslation(prev => {
                if (prev?.original === text) {
                    return { ...prev, translated: data.translatedText, isLoading: false };
                }
                return prev;
            });
        } catch (e) {
            setSelectionTranslation(null);
            toast.error('Failed to translate selection');
        }
    };

    // Close translation popover if clicked outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectionTranslation) {
                const target = e.target as HTMLElement;
                if (!target.closest('.translation-popover')) {
                    setSelectionTranslation(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectionTranslation]);


    const currentText = isShowingTranslation && translatedText ? translatedText : item.body;

    // Format date string similar to GitHub
    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';

    return (
        <div className={`relative rounded-md border bg-[#0d1117] shadow-sm mb-4 transition-all ${isMainBody ? 'border-[#30363d]' : 'border-[#30363d] ml-8 lg:ml-12'}`}>
            {!isMainBody && (
                <div className="absolute -left-12 sm:-left-16 top-0 h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#0d1117] bg-[#0d1117]">
                    <img src={item.avatarUrl} alt={item.author} className="h-full w-full object-cover" />
                </div>
            )}

            {/* Connecting line for timeline */}
            {!isMainBody && (
                <div className="absolute -left-7 top-4 w-6 border-t-[2px] border-[#30363d] z-[-1]"></div>
            )}

            {/* Author Header */}
            <div className={`border-b border-[#30363d] bg-[#161b22] px-4 py-2 flex items-center justify-between ${!isMainBody ? 'rounded-t-md' : ''}`}>
                <div className="flex items-center gap-2 min-w-0">
                    {isMainBody && (
                        <img src={item.avatarUrl} alt={item.author} className="h-6 w-6 rounded-full" />
                    )}
                    <div className="text-sm text-[#8b949e] flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <span className="font-semibold text-[#e6edf3] hover:underline cursor-pointer truncate">{item.author}</span>
                        <span className="whitespace-nowrap flex-shrink-0">commented {formattedDate}</span>

                        {item.authorAssociation && item.authorAssociation !== 'NONE' && (
                            <span className="px-2 py-0.5 rounded-full border border-[#30363d] text-[10px] font-medium text-[#8b949e] capitalize hidden sm:inline-block">
                                {item.authorAssociation.toLowerCase()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Individual Translate Button */}
                    <button
                        onClick={handleTranslateToggle}
                        disabled={isTranslating}
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors border rounded-md ${isShowingTranslation
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-transparent text-[#8b949e] border-transparent hover:bg-[#30363d] hover:text-[#e6edf3]'
                            }`}
                    >
                        {isTranslating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isShowingTranslation ? (
                            <>
                                <ArrowRightLeft className="h-3 w-3" />
                                <span className="hidden sm:inline">Original</span>
                            </>
                        ) : (
                            <>
                                <Languages className="h-3 w-3" />
                                <span className="hidden sm:inline">Translate</span>
                            </>
                        )}
                    </button>

                </div>
            </div>

            {/* Body */}
            <div className="p-4 relative group">
                {isShowingTranslation && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                )}
                <div
                    ref={proseRef}
                    className="prose-github selection:bg-blue-500/30 selection:text-white overflow-hidden"
                    onMouseUp={handleSelection}
                    onTouchEnd={handleSelection}
                >
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]} 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            a: ({ node, ...props }) => (
                                <a 
                                    {...props} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-400 hover:underline font-medium"
                                />
                            )
                        }}
                    >
                        {currentText}
                    </ReactMarkdown>
                </div>

                {/* Selection Translation Floating UI */}
                {selectionTranslation && (
                    <div
                        className="translation-popover fixed z-50 bg-[#161b22] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#30363d] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: `${Math.max(10, (selectionTranslation.position?.y || 0) - 10)}px`,
                            left: `${selectionTranslation.position?.x || 0}px`,
                            transform: 'translate(-50%, -100%)' // Center horizontally and move ABOVE the point
                        }}
                    >
                        {selectionTranslation.isLoading ? (
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] text-blue-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs font-semibold tracking-wide uppercase">Translating...</span>
                            </div>
                        ) : selectionTranslation.translated ? (
                            <div className="flex flex-col min-w-[200px] max-w-sm">
                                <div className="flex items-center justify-between gap-4 px-4 py-2 bg-[#0d1117] border-b border-[#30363d]">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Languages className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">Translation</span>
                                    </div>
                                    <button 
                                        onClick={() => setSelectionTranslation(null)}
                                        className="text-[#8b949e] hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="p-4 overflow-y-auto max-h-[200px] custom-scrollbar">
                                    <span className="text-sm leading-relaxed text-[#e6edf3] whitespace-pre-wrap">
                                        {selectionTranslation.translated}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    performSelectionTranslation();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95"
                            >
                                <Languages className="h-4 w-4" />
                                <span className="text-sm font-bold">Translate</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
