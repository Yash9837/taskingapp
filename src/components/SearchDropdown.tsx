'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, getProjects, getIssues } from '@/lib/firestore';
import { Task, Project, Issue } from '@/lib/types';

interface SearchResult {
    type: 'task' | 'project' | 'issue';
    id: string;
    title: string;
    subtitle: string;
    href: string;
}

interface SearchDropdownProps {
    onClose: () => void;
}

export default function SearchDropdown({ onClose }: SearchDropdownProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cached data
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Load data once
    useEffect(() => {
        const loadData = async () => {
            try {
                const [t, p, i] = await Promise.all([
                    getTasks(),
                    getProjects(),
                    getIssues(),
                ]);
                setTasks(t);
                setProjects(p);
                setIssues(i);
                setDataLoaded(true);
            } catch (err) {
                console.error('Search data load error:', err);
            }
        };
        loadData();
    }, []);

    const search = useCallback(
        (q: string) => {
            if (!q.trim() || !dataLoaded) {
                setResults([]);
                return;
            }

            const lower = q.toLowerCase();
            const matched: SearchResult[] = [];

            // Tasks
            tasks
                .filter((t) => t.title.toLowerCase().includes(lower))
                .slice(0, 5)
                .forEach((t) =>
                    matched.push({
                        type: 'task',
                        id: t.id,
                        title: t.title,
                        subtitle: `Task • ${t.status}`,
                        href: '/tasks',
                    })
                );

            // Projects
            projects
                .filter((p) => p.name.toLowerCase().includes(lower))
                .slice(0, 3)
                .forEach((p) =>
                    matched.push({
                        type: 'project',
                        id: p.id,
                        title: p.name,
                        subtitle: `Project • ${p.status}`,
                        href: `/projects/${p.id}`,
                    })
                );

            // Issues
            issues
                .filter((i) => i.title.toLowerCase().includes(lower))
                .slice(0, 3)
                .forEach((i) =>
                    matched.push({
                        type: 'issue',
                        id: i.id,
                        title: i.title,
                        subtitle: `Issue • ${i.severity} severity`,
                        href: '/issues',
                    })
                );

            setResults(matched);
            setActiveIndex(-1);
        },
        [tasks, projects, issues, dataLoaded]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => search(val), 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            navigateTo(results[activeIndex]);
        }
    };

    const navigateTo = (result: SearchResult) => {
        router.push(result.href);
        onClose();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'task':
                return (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                );
            case 'project':
                return (
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                );
            case 'issue':
                return (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-50" style={{ minWidth: '320px' }}>
            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border-color)]">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search tasks, projects, issues..."
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto">
                {query && results.length === 0 && !loading && (
                    <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                        No results found for &ldquo;{query}&rdquo;
                    </div>
                )}

                {results.map((result, idx) => (
                    <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => navigateTo(result)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === activeIndex
                                ? 'bg-indigo-500/10'
                                : 'hover:bg-[var(--bg-hover)]'
                            }`}
                    >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {result.title}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] capitalize">
                                {result.subtitle}
                            </p>
                        </div>
                    </button>
                ))}

                {!query && (
                    <div className="p-4 text-center text-xs text-[var(--text-tertiary)]">
                        Type to search across tasks, projects, and issues
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--border-color)] flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-[var(--text-tertiary)]">↑↓</kbd>
                navigate
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-[var(--text-tertiary)] ml-2">↵</kbd>
                select
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded text-[var(--text-tertiary)] ml-2">esc</kbd>
                close
            </div>
        </div>
    );
}
