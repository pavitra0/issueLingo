'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Github,
    Globe,
    Loader2,
    MessageSquare,
    Send,
    Copy,
    Check,
    MessageCircle,
    AlertCircle,
    Languages,
    ArrowLeft,
    Zap,
    TrendingUp,
    Clock,
    Star,
    BarChart2,
    Eye,
    Sparkles,
    BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import IssueCommentCard from '@/components/IssueCommentCard';
import LanguageSelector from '@/components/LanguageSelector';
import { getLanguageByCode } from '@/lib/languages';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Types
type Comment = {
    id: number;
    author: string;
    avatarUrl: string;
    body: string;
    createdAt?: string;
    authorAssociation?: string;
};

type Label = {
    name: string;
    color: string;
};

type Assignee = {
    login: string;
    avatarUrl: string;
};

type IssueData = {
    title: string;
    number: number;
    state: string;
    author: string;
    avatarUrl: string;
    authorAssociation?: string;
    createdAt?: string;
    commentsCount: number;
    body: string;
    labels: Label[];
    assignees: Assignee[];
    milestone: string | null;
    comments: Comment[];
};

export default function IssuePage() {
    const params = useParams();
    const slug = params?.slug as string[]; // [owner, repo, number]

    const [targetLanguage, setTargetLanguage] = useState('es');

    // Helper to get display name from language code (for API calls that need the name)
    const getLanguageName = (code: string) => {
        const lang = getLanguageByCode(code);
        return lang ? lang.name : 'Spanish';
    };

    // Loading states
    const [isFetchingIssue, setIsFetchingIssue] = useState(true);
    const [isTranslatingThread, setIsTranslatingThread] = useState(false);

    // Data states
    const [issueData, setIssueData] = useState<IssueData | null>(null);
    const [translatedIssueData, setTranslatedIssueData] = useState<IssueData | null>(null);

    // Reply states
    const [replyText, setReplyText] = useState('');
    const [isTranslatingReply, setIsTranslatingReply] = useState(false);
    const [translatedReply, setTranslatedReply] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const languages = ['Spanish', 'French', 'Japanese', 'Hindi', 'German'];

    // --- Live Preview State ---
    const livePreviewDebounce = useRef<NodeJS.Timeout | null>(null);
    const [livePreview, setLivePreview] = useState('');
    const [isLivePreviewing, setIsLivePreviewing] = useState(false);

    // --- Stats State ---
    const [sessionStats, setSessionStats] = useState({ translationsUsed: 0, tokensSaved: 0 });

    // Compute difficulty score from issue data (pure client-side, no API needed)
    const computeDifficultyFromIssue = (data: IssueData) => {
        const totalChars = data.body.length + data.comments.reduce((a, c) => a + c.body.length, 0);
        const commentCount = data.comments.length;
        const labelNames = data.labels.map(l => l.name.toLowerCase());
        const isGoodFirstIssue = labelNames.some(l => l.includes('good first') || l.includes('beginner') || l.includes('starter'));
        const isHard = labelNames.some(l => l.includes('complex') || l.includes('senior') || l.includes('architecture') || l.includes('core'));

        let score = 0;
        if (totalChars > 3000) score += 2;
        else if (totalChars > 1000) score += 1;
        if (commentCount > 15) score += 3;
        else if (commentCount > 5) score += 2;
        else score += 1;
        if (isHard) score += 3;
        if (isGoodFirstIssue) score -= 2;

        if (score <= 2) return { label: 'Good First Issue', color: '#3fb950', bg: 'bg-green-500/10 border-green-500/30', bar: 20, icon: '🌱' };
        if (score <= 4) return { label: 'Intermediate', color: '#d29922', bg: 'bg-yellow-500/10 border-yellow-500/30', bar: 50, icon: '⚡' };
        if (score <= 6) return { label: 'Senior', color: '#f78166', bg: 'bg-orange-500/10 border-orange-500/30', bar: 75, icon: '🔥' };
        return { label: 'Expert / Core', color: '#ff7b72', bg: 'bg-red-500/10 border-red-500/30', bar: 100, icon: '💀' };
    };

    useEffect(() => {
        if (slug && slug.length >= 3) {
            const owner = slug[0];
            const repo = slug[1];
            const issueNumber = slug[2];
            const fullUrl = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
            fetchIssue(fullUrl);
        } else {
            setIsFetchingIssue(false);
            toast.error('Invalid issue URL routing parameter');
        }
    }, [slug]);

    const fetchIssue = async (url: string) => {
        try {
            const response = await fetch('/api/fetch-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch issue data');
            }

            const data = await response.json();
            setIssueData(data);
        } catch (error) {
            toast.error('Failed to load thread. Please try again.');
        } finally {
            setIsFetchingIssue(false);
        }
    };

    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [contributionRoadmap, setContributionRoadmap] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

    const handleSummarize = async () => {
        if (!issueData) return;
        setIsSummarizing(true);
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: issueData.title,
                    body: issueData.body,
                    comments: issueData.comments,
                    targetLanguage
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAiSummary(data.summary);
            toast.success('AI Summary ready!');
        } catch (e: any) {
            toast.error(e.message || 'Failed to summarize.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleGenerateRoadmap = async () => {
        if (!displayData) return;
        setIsGeneratingRoadmap(true);
        try {
            const res = await fetch('/api/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: displayData.title,
                    body: displayData.body,
                    comments: displayData.comments,
                    targetLanguage
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setContributionRoadmap(data.roadmap);
            toast.success('Contribution Roadmap generated!');
        } catch (e) {
            toast.error('Failed to generate roadmap.');
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    const handleTranslateThread = async () => {
        if (!issueData) return;

        setIsTranslatingThread(true);

        // Create the payload we want to translate
        const payloadObject = {
            title: issueData.title,
            body: issueData.body,
            comments: issueData.comments.map(c => c.body)
        };

        try {
            const response = await fetch('/api/translate-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payloadObject, targetLanguage: getLanguageName(targetLanguage) }),
            });

            if (!response.ok) {
                throw new Error('Failed to translate thread');
            }

            const localizedPayload = await response.json();

            // Merge translated payload back into the IssueData structure
            setTranslatedIssueData({
                ...issueData,
                title: localizedPayload.title,
                body: localizedPayload.body,
                comments: issueData.comments.map((c, index) => ({
                    ...c,
                    body: localizedPayload.comments[index] || c.body
                }))
            });

            toast.success(`Thread translated to ${targetLanguage}!`);
        } catch (error) {
            toast.error('Failed to translate thread. Please try again.');
        } finally {
            setIsTranslatingThread(false);
        }
    };

    const handleTranslateReply = async () => {
        if (!replyText.trim()) {
            toast.error('Please enter a reply to translate');
            return;
        }

        setIsTranslatingReply(true);
        try {
            const response = await fetch('/api/translate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: replyText }),
            });

            if (!response.ok) {
                throw new Error('Failed to translate reply');
            }

            const data = await response.json();
            setTranslatedReply(data.translatedText);
            toast.success('Reply translated to English!');
        } catch (error) {
            toast.error('Failed to translate reply. Please try again.');
        } finally {
            setIsTranslatingReply(false);
        }
    };

    // Live Preview: debounced translation as user types
    const handleReplyInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setReplyText(val);
        setTranslatedReply('');
        if (!val.trim() || val.length < 8) { setLivePreview(''); return; }
        if (livePreviewDebounce.current) clearTimeout(livePreviewDebounce.current);
        livePreviewDebounce.current = setTimeout(async () => {
            setIsLivePreviewing(true);
            try {
                const res = await fetch('/api/translate-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: val, targetLanguage: 'English' }),
                });
                const data = await res.json();
                setLivePreview(data.translatedText || '');
                setSessionStats(prev => ({ ...prev, tokensSaved: prev.tokensSaved + Math.floor(val.length * 0.4) }));
            } catch { }
            finally { setIsLivePreviewing(false); }
        }, 900);
    };

    const handleCopy = () => {
        if (!translatedReply) return;
        navigator.clipboard.writeText(translatedReply);
        setIsCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Decide which data to render (translated takes precedence)
    const displayData = translatedIssueData || issueData;

    const headerLabel = slug?.length >= 3 ? `${slug[0]}/${slug[1]}#${slug[2]}` : 'Issue';

    return (
        <main className="min-h-screen bg-[#0d1117] pb-24 selection:bg-blue-500/30 text-gray-300">
            {/* Small Header */}
            <div className="sticky top-0 z-50 border-b border-[#30363d] bg-[#010409]/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Back to Search</span>
                    </Link>
                    <div className="flex items-center gap-2 text-white">
                        <Github className="h-4 w-4" />
                        <span className="text-sm font-medium">{headerLabel}</span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Translator Toolbar */}
                {issueData && !isFetchingIssue && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#30363d] bg-[#161b22] p-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-2 text-blue-400">
                            <Languages className="h-5 w-5" />
                            <span className="text-sm font-medium">Translate entire thread to:</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleGenerateRoadmap}
                                disabled={isGeneratingRoadmap || !displayData}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 px-4 py-2.5 text-sm font-medium hover:bg-purple-500/20 disabled:opacity-50 transition-all shadow-sm"
                                title="Analyze issue to find exactly what to fix"
                            >
                                {isGeneratingRoadmap ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                                Roadmap
                            </button>
                            <button
                                onClick={handleSummarize}
                                disabled={isSummarizing || !issueData}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 px-4 py-2.5 text-sm font-medium hover:bg-amber-500/20 disabled:opacity-50 transition-all shadow-sm"
                                title="AI-powered thread summary"
                            >
                                {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                AI Summary
                            </button>
                            <LanguageSelector
                                selectedLanguage={targetLanguage}
                                onLanguageChange={(code) => {
                                    if (code) setTargetLanguage(code);
                                }}
                            />
                            <button
                                onClick={handleTranslateThread}
                                disabled={isTranslatingThread}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#238636] text-white px-4 py-2.5 text-sm font-medium shadow hover:bg-[#2ea043] focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                            >
                                {isTranslatingThread ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Translate All"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Summary Box */}
                {aiSummary && (
                    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 animate-in slide-in-from-top-4 duration-400 shadow-lg">
                        <div className="flex items-center gap-2 text-amber-400 mb-3 border-b border-amber-500/20 pb-2">
                            <Sparkles className="h-4 w-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">AI Thread Summary</h3>
                            <span className="ml-auto text-[10px] text-amber-400/50 font-mono">Powered by Gemini</span>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none text-gray-200">
                            <ReactMarkdown>{aiSummary}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Contribution Roadmap Box */}
                {contributionRoadmap && (
                    <div className="mb-8 rounded-xl border border-purple-500/40 bg-purple-500/5 p-6 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Github className="h-32 w-32 -mr-12 -mt-12" />
                        </div>
                        <div className="flex items-center gap-2 text-purple-400 mb-4 border-b border-purple-500/20 pb-2">
                            <Check className="h-5 w-5" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Contributor's Roadmap</h3>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none text-gray-200 prose-ul:list-disc prose-li:my-1">
                            <ReactMarkdown>{contributionRoadmap}</ReactMarkdown>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[10px] text-purple-400/60 font-medium uppercase tracking-widest">
                            <AlertCircle className="h-3 w-3" />
                            <span>Action items extracted from issue context</span>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {(isFetchingIssue) && (
                    <div className="mt-8 space-y-6">
                        <div className="h-10 w-3/4 rounded-lg bg-[#30363d] animate-pulse" />
                        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-full bg-[#30363d] animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-5 w-64 rounded-lg bg-[#30363d] animate-pulse" />
                                    <div className="h-4 w-32 rounded-lg bg-[#30363d] animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Issue Header and Multi-Column Layout */}
                {displayData && !isFetchingIssue && (
                    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out transition-opacity ${isTranslatingThread ? 'opacity-50' : 'opacity-100'}`}>
                        {/* Title + Difficulty Meter Section */}
                        <div className="border-b border-[#30363d] pb-4 mb-6">
                            <h1 className="text-3xl font-semibold text-white break-words">
                                {displayData.title} <span className="text-[#8b949e] font-light">#{displayData.number}</span>
                            </h1>
                            <div className="mt-3 flex items-center gap-2 text-sm text-[#8b949e]">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white ${displayData.state === 'open' ? 'bg-[#238636]' : 'bg-[#8957e5]'}`}>
                                    {displayData.state === 'open' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                    {displayData.state === 'open' ? 'Open' : 'Closed'}
                                </span>
                                <span>
                                    <span className="font-semibold text-white">{displayData.author}</span> opened this issue {displayData.createdAt ? new Date(displayData.createdAt).toLocaleDateString() : 'recently'} · {displayData.commentsCount} comments
                                </span>
                            </div>

                            {/* 🔥 Difficulty Meter */}
                            {issueData && (() => {
                                const diff = computeDifficultyFromIssue(issueData);
                                return (
                                    <div className={`mt-4 inline-flex items-center gap-3 rounded-xl border px-4 py-2 ${diff.bg}`}>
                                        <span className="text-base">{diff.icon}</span>
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: diff.color }}>Issue Complexity</div>
                                            <div className="text-sm font-bold text-white">{diff.label}</div>
                                        </div>
                                        <div className="ml-2 w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full transition-all duration-700"
                                                style={{ width: `${diff.bar}%`, backgroundColor: diff.color }}
                                            />
                                        </div>
                                        <div className="text-xs text-white/40 font-mono">{diff.bar}%</div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* 2-Column Layout */}
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Main Content (Left) */}
                            <div className="flex-1 min-w-0">
                                <div className="mb-6 relative">
                                    {isTranslatingThread && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                    <IssueCommentCard
                                        item={{
                                            author: displayData.author,
                                            avatarUrl: displayData.avatarUrl,
                                            body: displayData.body,
                                            title: displayData.title,
                                            authorAssociation: displayData.authorAssociation,
                                            createdAt: displayData.createdAt
                                        }}
                                        isMainBody={true}
                                        targetLanguage={targetLanguage}
                                    />
                                </div>

                                <div className="pl-6 sm:pl-12 space-y-6 relative before:content-[''] before:absolute before:left-3 sm:before:left-6 before:top-4 before:bottom-4 before:w-[2px] before:bg-[#30363d]">
                                    {displayData.comments.map((comment) => (
                                        <IssueCommentCard
                                            key={comment.id}
                                            item={{
                                                author: comment.author,
                                                avatarUrl: comment.avatarUrl,
                                                body: comment.body,
                                                authorAssociation: comment.authorAssociation,
                                                createdAt: comment.createdAt
                                            }}
                                            targetLanguage={targetLanguage}
                                        />
                                    ))}
                                </div>

                                {/* Reverse Reply Box */}
                                <div className="pl-6 sm:pl-12 relative pt-6 border-t border-[#30363d] mt-8">
                                    <div className="relative rounded-2xl border border-[#30363d] bg-[#161b22] p-6 sm:p-8">
                                        <div className="mb-4 flex items-center gap-2 text-white">
                                            <MessageCircle className="h-5 w-5" />
                                            <h3 className="font-medium">Draft your reply</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Reply textarea with live preview */}
                                            <div className="relative">
                                                <textarea
                                                    value={replyText}
                                                    onChange={handleReplyInput}
                                                    placeholder={`Write your reply in ${targetLanguage} or any language...`}
                                                    className="min-h-[120px] w-full resize-y rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-sm text-gray-300 placeholder:text-[#8b949e] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono shadow-inner mb-4"
                                                />
                                                {isLivePreviewing && (
                                                    <div className="absolute top-3 right-3 text-xs text-[#8b949e] flex items-center gap-1 animate-pulse">
                                                        <Eye className="h-3 w-3" /> Previewing...
                                                    </div>
                                                )}
                                            </div>

                                            {/* 🔥 Live English Preview Panel */}
                                            {livePreview && !translatedReply && (
                                                <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden animate-in fade-in duration-300">
                                                    <div className="flex items-center gap-2 border-b border-blue-500/20 bg-blue-500/10 px-4 py-2">
                                                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                                                        <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">Live English Preview</span>
                                                        <span className="ml-auto text-[10px] text-blue-400/50">Updates as you type</span>
                                                    </div>
                                                    <div className="p-4">
                                                        <p className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{livePreview}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end border-t border-[#30363d] pt-6">
                                                <button
                                                    onClick={handleTranslateReply}
                                                    disabled={isTranslatingReply || !replyText.trim()}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#238636] text-white px-6 py-2.5 text-sm font-medium shadow-lg hover:bg-[#2ea043] focus:outline-none focus:ring-2 focus:ring-[#2ea043]/50 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                                                >
                                                    {isTranslatingReply ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Translating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4" />
                                                            Translate to English
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Translated Output */}
                                            {translatedReply && (
                                                <div className="mt-6 rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-2">
                                                        <span className="text-xs font-medium tracking-wide text-[#8b949e] uppercase">English Translation</span>
                                                        <button
                                                            onClick={handleCopy}
                                                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8b949e] hover:bg-[#30363d] hover:text-white transition-colors"
                                                        >
                                                            {isCopied ? (
                                                                <>
                                                                    <Check className="h-3.5 w-3.5 text-[#3fb950]" />
                                                                    <span className="text-[#3fb950]">Copied</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                    Copy to Clipboard
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="p-4">
                                                        <p className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{translatedReply}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar (Right) */}
                            <div className="w-full lg:w-72 shrink-0 space-y-6 text-sm">

                                {/* 🔥 IssueLingo Stats Card */}
                                <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-[#8b949e] border-b border-[#30363d] pb-2 mb-3">
                                        <BarChart2 className="h-4 w-4" />
                                        <h3 className="font-semibold text-white text-xs uppercase tracking-widest">Session Stats</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1 rounded-lg bg-[#161b22] border border-[#30363d] p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-[#8b949e]">Comments</span>
                                            <span className="text-2xl font-bold text-white">{displayData.commentsCount}</span>
                                            <span className="text-[10px] text-[#8b949e]">in thread</span>
                                        </div>
                                        <div className="flex flex-col gap-1 rounded-lg bg-[#161b22] border border-[#30363d] p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-[#8b949e]">Words</span>
                                            <span className="text-2xl font-bold text-white">
                                                {Math.round((displayData.body.length + displayData.comments.reduce((a, c) => a + c.body.length, 0)) / 5)}
                                            </span>
                                            <span className="text-[10px] text-[#8b949e]">in issue</span>
                                        </div>
                                        <div className="flex flex-col gap-1 rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-purple-400">Tokens Saved</span>
                                            <span className="text-2xl font-bold text-purple-300">{sessionStats.tokensSaved}</span>
                                            <span className="text-[10px] text-purple-400/60">this session</span>
                                        </div>
                                        <div className="flex flex-col gap-1 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-blue-400">Language</span>
                                            <span className="text-xl font-bold text-blue-300">{targetLanguage.slice(0, 6)}</span>
                                            <span className="text-[10px] text-blue-400/60">target</span>
                                        </div>
                                    </div>
                                    <div className="mt-1 text-[10px] text-center text-[#8b949e]/50 pt-2 border-t border-[#30363d]">
                                        🌍 IssueLingo · Breaking language barriers
                                    </div>
                                </div>

                                <div className="border-b border-[#30363d] pb-4">
                                    <h3 className="font-semibold text-white mb-2">Assignees</h3>
                                    {displayData.assignees.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {displayData.assignees.map(a => (
                                                <div key={a.login} className="flex items-center gap-2 text-[#8b949e] hover:text-blue-400 cursor-pointer">
                                                    <img src={a.avatarUrl} alt={a.login} className="w-5 h-5 rounded-full" />
                                                    <span>{a.login}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[#8b949e]">No one assigned</span>
                                    )}
                                </div>

                                <div className="border-b border-[#30363d] pb-4">
                                    <h3 className="font-semibold text-white mb-2">Labels</h3>
                                    {displayData.labels.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {displayData.labels.map(l => (
                                                <span
                                                    key={l.name}
                                                    className="px-2 py-0.5 rounded-full text-xs font-medium border"
                                                    style={{
                                                        backgroundColor: `#${l.color}20`,
                                                        color: `#${l.color}`,
                                                        borderColor: `#${l.color}40`
                                                    }}
                                                >
                                                    {l.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[#8b949e]">None yet</span>
                                    )}
                                </div>

                                <div className="border-b border-[#30363d] pb-4">
                                    <h3 className="font-semibold text-white mb-2">Projects</h3>
                                    <span className="text-[#8b949e]">None yet</span>
                                </div>

                                <div className="border-b border-[#30363d] pb-4">
                                    <h3 className="font-semibold text-white mb-2">Milestone</h3>
                                    {displayData.milestone ? (
                                        <span className="text-[#8b949e] hover:text-blue-400 cursor-pointer flex items-center gap-1">
                                            <span className="w-4 h-4 rounded-full border border-[#3fb950] flex items-center justify-center">
                                                <span className="w-1.5 h-1.5 bg-[#3fb950] rounded-full"></span>
                                            </span>
                                            {displayData.milestone}
                                        </span>
                                    ) : (
                                        <span className="text-[#8b949e]">No milestone</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
