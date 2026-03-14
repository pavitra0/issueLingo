'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Globe, Loader2, Languages, MapPin, Zap, Code2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const features = [
  {
    icon: Languages,
    title: 'Translate Any Thread',
    description: 'Instantly translate full issue discussions into 38+ languages, preserving all code snippets.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: MapPin,
    title: 'Contribution Roadmap',
    description: 'AI-powered checklist showing exactly what to fix, what files to look at, and how to test.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Zap,
    title: 'Live Reply Preview',
    description: 'Write in your language. See perfect English as you type. Post with confidence.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    icon: Code2,
    title: 'Code-Safe Translation',
    description: 'Code blocks, variable names and commands are never translated — only prose.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const handleGoToIssue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) { toast.error('URL cannot be empty'); return; }
    if (!url.includes('github.com') || !url.includes('/issues/')) {
      toast.error('Please enter a valid GitHub issue URL');
      return;
    }

    setIsRedirecting(true);
    try {
      const urlParts = new URL(url).pathname.split('/');
      if (urlParts.length < 5) throw new Error('Invalid format');
      const owner = urlParts[1];
      const repo = urlParts[2];
      const issueNumber = urlParts[4];
      router.push(`/issue/${owner}/${repo}/${issueNumber}`);
    } catch {
      setIsRedirecting(false);
      toast.error('Could not parse GitHub URL format.');
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-[#010409] selection:bg-blue-500/30">

      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen animate-blob-1" />
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-600/30 blur-[120px] rounded-full mix-blend-screen animate-blob-2" />
        <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-pink-600/20 blur-[120px] rounded-full mix-blend-screen animate-blob-3" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ccircle cx=%221%22 cy=%221%22 r=%220.8%22 fill=%22%23ffffff%22 fill-opacity=%220.04%22/%3E%3C/svg%3E')]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl space-y-12">

        {/* Hero */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Logo mark */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl bg-white/10 ">
              <Github className="h-8 w-8 text-purple-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-[#010409] animate-pulse" />
          </div>

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Zap className="w-3 h-3" />
            Powered by Lingo.dev · 38 Languages
          </div>

          <div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white">
              Issue<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Lingo</span>
            </h1>
            <p className="mt-4 text-lg text-[#8b949e] max-w-lg leading-relaxed">
              Break language barriers in Open Source.<br />
              <span className="text-white/80">Read, understand, and contribute to any GitHub issue — in your language.</span>
            </p>
          </div>
        </div>

        {/* Input Card */}
        <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-2 shadow-2xl shadow-black/50">
          <form onSubmit={handleGoToIssue} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Github className="h-5 w-5 text-[#8b949e]" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/facebook/react/issues/123"
                className="w-full rounded-xl border border-[#30363d] bg-[#161b22] py-4 pl-12 pr-4 text-base text-gray-200 placeholder:text-[#8b949e] focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isRedirecting}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 text-sm font-semibold shadow-lg hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#010409] disabled:pointer-events-none disabled:opacity-50 transition-all shrink-0"
            >
              {isRedirecting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Loading...</>
              ) : (
                <>Open Thread <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className={`rounded-xl border p-4 space-y-2 ${f.bg}`}>
              <f.icon className={`h-5 w-5 ${f.color}`} />
              <div className={`text-xs font-bold ${f.color}`}>{f.title}</div>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 mt-8">
          <p className="text-center text-xs text-[#8b949e]/60 font-bold">
            No login required · No data stored · Open Source
          </p>
          <p className="text-center text-[11px] text-[#8b949e]/40 max-w-sm">
            Crafted with passion to demonstrate how AI can break language barriers, making open source accessible to everyone worldwide.
          </p>
        </div>
      </div>
    </main>
  );
}
