'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, actionLabel, onAction, action }: EmptyStateProps) {
  const finalLabel = actionLabel || action?.label;
  const finalAction = onAction || action?.onClick;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon ? (
        <div className="mb-5 p-4 bg-[var(--accent-glow)] rounded-2xl border border-[var(--border-color)]">
          <div className="w-12 h-12 text-[var(--accent-light)] flex items-center justify-center">{icon}</div>
        </div>
      ) : (
        <div className="mb-5 p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)]">
          <svg className="w-12 h-12 text-[var(--text-tertiary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 text-center">{title}</h3>
      <p className="text-[13px] text-[var(--text-tertiary)] text-center mb-6 max-w-sm">{description}</p>
      {finalLabel && finalAction && (
        <button
          onClick={finalAction}
          className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-[13px] font-medium transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {finalLabel}
        </button>
      )}
    </div>
  );
}
