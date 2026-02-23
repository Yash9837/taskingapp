'use client';

interface StatusBadgeProps {
  status: string;
  type?: 'task' | 'issue' | 'project' | 'priority';
}

export default function StatusBadge({ status, type = 'task' }: StatusBadgeProps) {
  const getStyles = (status: string, type: string) => {
    const s = status.toLowerCase().replace(/\s+/g, '-');

    if (type === 'task') {
      switch (s) {
        case 'todo': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        case 'in-progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'done': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        default: return 'bg-[var(--bg-input)] text-[var(--text-tertiary)] border-[var(--border-color)]';
      }
    }

    if (type === 'issue') {
      switch (s) {
        case 'open': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'in-progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'closed': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        default: return 'bg-[var(--bg-input)] text-[var(--text-tertiary)] border-[var(--border-color)]';
      }
    }

    if (type === 'project') {
      switch (s) {
        case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'on-hold': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        default: return 'bg-[var(--bg-input)] text-[var(--text-tertiary)] border-[var(--border-color)]';
      }
    }

    if (type === 'priority') {
      switch (s) {
        case 'low': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
        default: return 'bg-[var(--bg-input)] text-[var(--text-tertiary)] border-[var(--border-color)]';
      }
    }

    return 'bg-[var(--bg-input)] text-[var(--text-tertiary)] border-[var(--border-color)]';
  };

  const getDot = (status: string, type: string) => {
    const s = status.toLowerCase().replace(/\s+/g, '-');
    if (type === 'task') {
      switch (s) {
        case 'todo': return 'bg-zinc-400';
        case 'in-progress': return 'bg-blue-400';
        case 'review': return 'bg-amber-400';
        case 'done': return 'bg-emerald-400';
        default: return 'bg-zinc-500';
      }
    }
    if (type === 'issue') {
      switch (s) {
        case 'open': return 'bg-red-400';
        case 'in-progress': return 'bg-amber-400';
        case 'resolved': return 'bg-emerald-400';
        case 'closed': return 'bg-zinc-400';
        default: return 'bg-zinc-500';
      }
    }
    return 'bg-zinc-500';
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getStyles(status, type)} capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDot(status, type)}`} />
      {status.replace(/-/g, ' ')}
    </span>
  );
}
