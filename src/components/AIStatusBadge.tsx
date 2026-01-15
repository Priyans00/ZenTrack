/**
 * AIStatusBadge Component
 * 
 * A subtle badge that shows AI availability status.
 * Designed to be non-intrusive - only shows when AI is available.
 * 
 * USAGE:
 * ------
 * <AIStatusBadge />              // Simple badge
 * <AIStatusBadge showTooltip />  // With tooltip
 * <AIStatusBadge compact />      // Icon only
 */

import { useAIAvailability } from '../hooks/useAIAvailability';

export interface AIStatusBadgeProps {
  /** Show detailed tooltip on hover */
  showTooltip?: boolean;
  
  /** Compact mode - icon only */
  compact?: boolean;
  
  /** Always show (even when AI is unavailable) */
  alwaysShow?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

export default function AIStatusBadge({ 
  showTooltip = true, 
  compact = false,
  alwaysShow = false,
  className = '',
}: AIStatusBadgeProps) {
  const { isAvailable, isInstalled, preferredModel, models } = useAIAvailability();
  
  // Don't render if AI is not available and we're not set to always show
  if (!isAvailable && !alwaysShow) {
    return null;
  }
  
  // Build tooltip content
  const getTooltipContent = (): string => {
    if (isAvailable) {
      return `AI Enabled (Local)\nModel: ${preferredModel}\n${models.length} model(s) available`;
    }
    if (isInstalled) {
      return 'Ollama is running but no compatible models found.\nInstall a model like llama3 or qwen2.5';
    }
    return 'Install Ollama to unlock local AI features.\nVisit: https://ollama.ai';
  };
  
  if (!isAvailable && alwaysShow) {
    // Show "unavailable" state
    return (
      <span 
        className={`inline-flex items-center gap-1 text-xs cursor-help ${className}`}
        style={{ color: 'var(--text-muted)' }}
        title={showTooltip ? getTooltipContent() : undefined}
      >
        {!compact && <span className="opacity-60">AI unavailable</span>}
        {compact && (
          <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </span>
    );
  }
  
  // Show "available" state
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${className}`}
      style={{ 
        backgroundColor: 'var(--accent-dim)', 
        color: 'var(--accent)' 
      }}
      title={showTooltip ? getTooltipContent() : undefined}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
      {!compact && 'AI Enabled (Local)'}
    </span>
  );
}

/**
 * AIInfoTooltip Component
 * 
 * A more detailed info component for settings pages or help sections.
 */
export function AIInfoCard() {
  const { isAvailable, isInstalled, preferredModel, models, forceRefresh, isChecking } = useAIAvailability();
  
  return (
    <div 
      className="rounded-xl p-4 space-y-3"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-color)' 
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg 
            className="w-5 h-5" 
            style={{ color: isAvailable ? 'var(--accent)' : 'var(--text-muted)' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Local AI
          </span>
        </div>
        
        <button
          onClick={() => forceRefresh()}
          disabled={isChecking}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ 
            backgroundColor: 'var(--bg-card-hover)', 
            color: 'var(--text-muted)' 
          }}
        >
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      
      {/* Status */}
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {isAvailable ? (
          <>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              AI features enabled
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Using: {preferredModel}
            </p>
            {models.length > 1 && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {models.length} models available
              </p>
            )}
          </>
        ) : isInstalled ? (
          <>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Ollama running, no compatible models
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Install a model to enable AI features:
            </p>
            <code 
              className="block mt-1 p-2 rounded text-xs"
              style={{ backgroundColor: 'var(--bg-card-hover)' }}
            >
              ollama pull llama3
            </code>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              AI not available
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              ZenTrack works great without AI. To enable AI features, install Ollama:
            </p>
            <a 
              href="https://ollama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 text-xs underline"
              style={{ color: 'var(--accent)' }}
            >
              https://ollama.ai
            </a>
          </>
        )}
      </div>
    </div>
  );
}
