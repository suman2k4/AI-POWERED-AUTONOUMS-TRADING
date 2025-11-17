/**
 * ==============================================================================
 * GlassCard Component - Glassmorphism UI
 * ==============================================================================
 * Reusable card component with glassmorphism effect for modern UI
 * ==============================================================================
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  blur = 'md',
  onClick 
}: GlassCardProps) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const variantClasses = {
    default: 'bg-white/10 border border-white/20',
    bordered: 'bg-white/5 border-2 border-white/30',
    elevated: 'bg-white/15 border border-white/25 shadow-2xl',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300',
        blurClasses[blur],
        variantClasses[variant],
        'hover:bg-white/20 hover:border-white/30',
        'hover:shadow-xl hover:scale-[1.02]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * GlassCard variants for specific use cases
 */

export function GlassCardHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('p-6 border-b border-white/10', className)}>
      {children}
    </div>
  );
}

export function GlassCardContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}

export function GlassCardFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('p-6 border-t border-white/10', className)}>
      {children}
    </div>
  );
}

/**
 * Trading-specific glass card variants
 */

export function TradingSignalCard({
  signal,
  className
}: {
  signal: {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    price: number;
    timestamp: string;
  };
  className?: string;
}) {
  const actionColors = {
    BUY: 'text-green-400 bg-green-500/20',
    SELL: 'text-red-400 bg-red-500/20',
    HOLD: 'text-yellow-400 bg-yellow-500/20',
  };

  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold text-white">{signal.symbol}</h3>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold',
              actionColors[signal.action]
            )}
          >
            {signal.action}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">${signal.price.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Confidence</span>
          <span className="text-white font-semibold">
            {(signal.confidence * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              signal.action === 'BUY' && 'bg-green-500',
              signal.action === 'SELL' && 'bg-red-500',
              signal.action === 'HOLD' && 'bg-yellow-500'
            )}
            style={{ width: `${signal.confidence * 100}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          {new Date(signal.timestamp).toLocaleString()}
        </div>
      </div>
    </GlassCard>
  );
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  className
}: {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <GlassCard variant="bordered" className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-white">{value}</div>
        
        {change !== undefined && (
          <div className={cn(
            'text-sm font-semibold flex items-center gap-1',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}>
            {isPositive ? '↑' : '↓'}
            {Math.abs(change).toFixed(2)}%
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function PerformanceCard({
  title,
  metrics,
  className
}: {
  title: string;
  metrics: Array<{ label: string; value: string | number; good?: boolean }>;
  className?: string;
}) {
  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-300">{metric.label}</span>
            <span className={cn(
              'text-sm font-semibold',
              metric.good === true && 'text-green-400',
              metric.good === false && 'text-red-400',
              metric.good === undefined && 'text-white'
            )}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
