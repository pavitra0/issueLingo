"use client";

import { useState, useRef, useEffect } from "react";
import {
    SUPPORTED_LANGUAGES,
    REGIONS,
    getLanguageByCode,
    type Language,
} from "@/lib/languages";
import { Check, ChevronDown, Globe, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
    sourceLanguage?: string;
    selectedLanguage?: string | null;
    onLanguageChange: (language: string | null) => void;
    disabled?: boolean;
}

export default function LanguageSelector({
    sourceLanguage,
    selectedLanguage: selectedLanguageProp,
    onLanguageChange,
    disabled = false,
}: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(selectedLanguageProp || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeRegion, setActiveRegion] = useState<string | null | undefined>(undefined);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredLanguages = searchQuery
        ? SUPPORTED_LANGUAGES.filter((lang) =>
            lang.code !== sourceLanguage &&
            (lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lang.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    const languagesByRegion = REGIONS.reduce((acc, region) => {
        const languages = SUPPORTED_LANGUAGES.filter(
            (lang) => lang.region === region && lang.code !== sourceLanguage
        );
        if (languages.length > 0) acc[region] = languages;
        return acc;
    }, {} as Record<string, Language[]>);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && Object.keys(languagesByRegion).length > 0 && activeRegion === undefined) {
            setActiveRegion(Object.keys(languagesByRegion)[0]);
        }
    }, [isOpen, languagesByRegion, activeRegion]);

    useEffect(() => {
        setSelectedLanguage(selectedLanguageProp || null);
    }, [selectedLanguageProp]);

    const handleSelect = (languageCode: string | null) => {
        setSelectedLanguage(languageCode);
        setIsOpen(false);
        setSearchQuery("");
        setActiveRegion(undefined);
        onLanguageChange(languageCode);
    };

    const selectedLang = selectedLanguage ? getLanguageByCode(selectedLanguage) : null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "group flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg border",
                    "bg-[#0d1117] border-[#30363d] hover:border-[#8b949e] text-gray-300 hover:text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isOpen && "border-blue-500/60 text-white ring-1 ring-blue-500/30"
                )}
            >
                <Globe className={cn("w-4 h-4 transition-colors", isOpen ? "text-blue-400" : "text-[#8b949e] group-hover:text-blue-400")} />
                <div className="flex flex-col items-start leading-none">
                    {selectedLang ? (
                        <>
                            <span className="text-[11px] text-[#8b949e] -mb-0.5">Translate to</span>
                            <span className="font-semibold">{selectedLang.nativeName}</span>
                        </>
                    ) : (
                        <span>Select Language</span>
                    )}
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-[#8b949e] transition-transform duration-200 ml-0.5", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-[480px] h-[380px] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">

                    {/* Search */}
                    <div className="p-3 border-b border-[#30363d] bg-[#161b22] flex-none">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b949e]" />
                            <input
                                type="text"
                                placeholder="Search 38 languages..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setActiveRegion(null); }}
                                className="w-full pl-8 pr-8 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-200 placeholder:text-[#8b949e]"
                                autoFocus
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Region Tabs (hidden during search) */}
                        {!searchQuery && (
                            <div className="w-32 border-r border-[#30363d] flex flex-col overflow-y-auto py-1.5 bg-[#010409]">
                                {Object.keys(languagesByRegion).map((region) => (
                                    <button
                                        key={region}
                                        onClick={() => setActiveRegion(region)}
                                        className={cn(
                                            "px-3 py-1.5 text-[11px] font-medium text-left transition-colors relative leading-snug",
                                            activeRegion === region
                                                ? "text-blue-400 bg-blue-500/10"
                                                : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
                                        )}
                                    >
                                        {activeRegion === region && (
                                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-500 rounded-full" />
                                        )}
                                        <span className="pl-1">{region}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Language Grid */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {searchQuery ? (
                                filteredLanguages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[#8b949e] gap-2">
                                        <Search className="w-7 h-7 opacity-20" />
                                        <p className="text-sm">No languages found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1">
                                        {filteredLanguages.map((lang) => (
                                            <LangButton key={lang.code} lang={lang} isSelected={selectedLanguage === lang.code} onClick={() => handleSelect(lang.code)} />
                                        ))}
                                    </div>
                                )
                            ) : activeRegion ? (
                                <div className="grid grid-cols-2 gap-1">
                                    {languagesByRegion[activeRegion]?.map((lang) => (
                                        <LangButton key={lang.code} lang={lang} isSelected={selectedLanguage === lang.code} onClick={() => handleSelect(lang.code)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-1">
                                    {SUPPORTED_LANGUAGES.filter(l => !sourceLanguage || l.code !== sourceLanguage).map((lang) => (
                                        <LangButton key={lang.code} lang={lang} isSelected={selectedLanguage === lang.code} onClick={() => handleSelect(lang.code)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e]">{SUPPORTED_LANGUAGES.length} languages · {REGIONS.length} regions</span>
                        <span className="text-[10px] text-[#8b949e]">Powered by <span className="text-blue-400 font-medium">Lingo.dev</span></span>
                    </div>
                </div>
            )}
        </div>
    );
}

function LangButton({ lang, isSelected, onClick }: { lang: Language; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-all border",
                isSelected
                    ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                    : "border-transparent hover:bg-[#161b22] text-[#8b949e] hover:text-white hover:border-[#30363d]"
            )}
        >
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{lang.nativeName}</div>
                {lang.nativeName !== lang.name && (
                    <div className="text-[10px] opacity-50 truncate">{lang.name}</div>
                )}
            </div>
            {isSelected && <Check className="w-3 h-3 shrink-0 text-blue-400" />}
        </button>
    );
}
