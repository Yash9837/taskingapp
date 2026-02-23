'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-[2px]',
    md: 'w-8 h-8 border-[2.5px]',
    lg: 'w-12 h-12 border-[3px]',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin`}
      />
    </div>
  );
}
