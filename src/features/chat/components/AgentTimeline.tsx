import { useMemo } from 'react';
import { Bot, GitBranch, Sparkles, ShieldCheck, BarChart3, Globe, Users } from 'lucide-react';
import type { AgentTraceStep } from '../model/chat';

interface AgentTimelineProps {
  trace: AgentTraceStep[];
}

const AGENT_ICON: Record<string, typeof Bot> = {
  IntentRouter: GitBranch,
  ChatOrchestrator: Sparkles,
  InsightCascadeAgent: Bot,
  MixerAnalysisAgent: BarChart3,
  PeerComparisonAgent: Users,
  GlobalTrendsAgent: Globe,
  LinkVerificationAgent: ShieldCheck,
};

const AGENT_COLOR: Record<string, string> = {
  IntentRouter: 'border-violet-300 bg-violet-50 text-violet-800',
  ChatOrchestrator: 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]',
  InsightCascadeAgent: 'border-amber-300 bg-amber-50 text-amber-800',
  MixerAnalysisAgent: 'border-rose-300 bg-rose-50 text-rose-800',
  PeerComparisonAgent: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  GlobalTrendsAgent: 'border-sky-300 bg-sky-50 text-sky-800',
  LinkVerificationAgent: 'border-teal-300 bg-teal-50 text-teal-800',
};

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  running: 'bg-amber-100 text-amber-800 animate-pulse',
  failed: 'bg-rose-100 text-rose-800',
  skipped: 'bg-gray-100 text-gray-600',
  pending: 'bg-gray-100 text-gray-600',
};

interface TimelineNode {
  step: AgentTraceStep;
  children: AgentTraceStep[];
}

function buildTree(steps: AgentTraceStep[]): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  const childrenByParent = new Map<number, AgentTraceStep[]>();
  for (const s of steps) {
    if (s.parent_step_idx !== null && s.parent_step_idx !== undefined) {
      if (!childrenByParent.has(s.parent_step_idx)) {
        childrenByParent.set(s.parent_step_idx, []);
      }
      childrenByParent.get(s.parent_step_idx)!.push(s);
    }
  }
  for (const s of steps) {
    if (s.parent_step_idx === null || s.parent_step_idx === undefined) {
      nodes.push({ step: s, children: childrenByParent.get(s.step_idx) ?? [] });
    }
  }
  return nodes;
}

function formatDuration(ms?: number | null): string {
  if (ms === undefined || ms === null) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AgentTimeline({ trace }: AgentTimelineProps) {
  const nodes = useMemo(() => buildTree(trace), [trace]);
  if (nodes.length === 0) return null;

  return (
    <div className="mt-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--axis-accent-strong)]">
          Agent collaboration timeline
        </span>
        <span className="text-[10px] text-[var(--axis-muted)]">
          {trace.length} steps
        </span>
      </div>
      <ol className="relative space-y-2 pl-3">
        {nodes.map((node) => (
          <TimelineRow key={node.step.step_idx} node={node} />
        ))}
      </ol>
    </div>
  );
}

function TimelineRow({ node }: { node: TimelineNode }) {
  const { step, children } = node;
  return (
    <li>
      <StepBadge step={step} />
      {children.length > 0 ? (
        <div className="mt-1 ml-6 grid gap-1 border-l border-dashed border-[var(--axis-hairline)] pl-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--axis-muted)]">
            ⤷ {children.length} agents in parallel
          </p>
          {children.map((child) => (
            <StepBadge key={child.step_idx} step={child} compact />
          ))}
        </div>
      ) : null}
    </li>
  );
}

function StepBadge({ step, compact = false }: { step: AgentTraceStep; compact?: boolean }) {
  const Icon = AGENT_ICON[step.agent] ?? Bot;
  const colorCls = AGENT_COLOR[step.agent] ?? 'border-gray-300 bg-gray-50 text-gray-700';
  const statusCls = STATUS_BADGE[step.status] ?? 'bg-gray-100 text-gray-600';
  return (
    <div
      className={`rounded-[var(--axis-radius-sm)] border px-2 py-1.5 text-[10px] ${colorCls} ${compact ? 'text-[10px]' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 font-bold">
          <Icon size={11} />
          <span>{step.step_idx}. {step.agent}</span>
          <span className="font-normal text-[var(--axis-muted)]">· {step.phase}</span>
        </div>
        <div className="flex items-center gap-1">
          {step.model ? (
            <span className="rounded-full bg-white/60 px-1.5 py-0.5 font-mono text-[9px]">
              {step.model}
            </span>
          ) : null}
          {step.duration_ms !== undefined && step.duration_ms !== null ? (
            <span className="font-mono text-[9px] text-[var(--axis-muted)]">
              {formatDuration(step.duration_ms)}
            </span>
          ) : null}
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusCls}`}>
            {step.status}
          </span>
        </div>
      </div>
      {step.output_summary ? (
        <p className="mt-1 truncate text-[10px] text-[var(--axis-body)]">→ {step.output_summary}</p>
      ) : null}
    </div>
  );
}
