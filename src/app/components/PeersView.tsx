import { BarChart3, Building2, CalendarRange, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { usePeers } from '../../features/peers/hooks/usePeers';
import type { PeriodFilter, PeerSummary } from '../../features/peers/model/peer';
import { uiText } from '../../shared/content/uiText';

interface PeersViewProps {
  onNavigate: (view: string) => void;
}

export function PeersView({ onNavigate: _onNavigate }: PeersViewProps) {
  const { peersData, isLoading, error } = usePeers();
  const [selectedPeer, setSelectedPeer] = useState<PeerSummary | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>('quarterly');
  const [periodValue, setPeriodValue] = useState('2026 Q2');
  const [isAddingPeer, setIsAddingPeer] = useState(false);
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerKeywords, setNewPeerKeywords] = useState('');

  const peers = peersData?.peers ?? [];
  const activePeer = selectedPeer ?? peers[0] ?? null;

  const handleAddPeer = () => {
    if (!peersData) {
      return;
    }
    const name = newPeerName.trim();
    if (!name) {
      return;
    }

    const addedPeer: PeerSummary = {
      id: `${name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '_')}_${Date.now()}`,
      name,
      keywords: newPeerKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean).slice(0, 4),
      priority: 'medium',
      stats: { primary: 0, watch: 0, archive: 0 },
      direction: uiText.peers.waitingDirection,
      implication: uiText.peers.waitingImplication,
    };

    peersData.peers.push(addedPeer);
    setSelectedPeer(addedPeer);
    setNewPeerName('');
    setNewPeerKeywords('');
    setIsAddingPeer(false);
  };

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="axis-page-header">
          <h1 className="axis-page-title">{uiText.peers.pageTitle}</h1>
          <p className="axis-page-subtitle">{uiText.peers.pageSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {uiText.common.loadError}
          </div>
        )}

        {isLoading && !peersData ? (
          <div className="axis-panel rounded-xl p-6 text-sm text-neutral-500">{uiText.common.loading}</div>
        ) : null}

        {peersData ? (
          <>
            <div className="axis-glass mb-6 rounded-xl bg-white/82 p-5">
              <div className="mb-4 flex items-center gap-3">
                <CalendarRange className="size-5 text-[#d96200]" />
                <h2 className="axis-section-title">{uiText.peers.basisTitle}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">{uiText.peers.periodUnit}</label>
                  <div className="flex flex-wrap gap-2">
                    {(['yearly', 'quarterly', 'monthly'] as PeriodFilter[]).map((item) => (
                      <button
                        key={item}
                        onClick={() => setPeriod(item)}
                        className={`axis-tab ${
                          period === item ? 'bg-[#ff7f00] text-white' : 'axis-soft-card text-black/70 hover:bg-white/78'
                        }`}
                      >
                        {peersData.periodLabels[item]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">{uiText.peers.periodValue}</label>
                  <select
                    value={periodValue}
                    onChange={(event) => setPeriodValue(event.target.value)}
                    className="axis-input w-full rounded-lg bg-white/92 px-3 py-2 text-sm outline-none"
                  >
                    <option value="2026">2026년</option>
                    <option value="2026 Q2">2026년 2분기</option>
                    <option value="2026 Q1">2026년 1분기</option>
                    <option value="2026-04">2026년 4월</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <div className="axis-panel p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-black">{uiText.peers.peerListTitle}</h2>
                    <button onClick={() => setIsAddingPeer(true)} className="flex items-center gap-1 rounded-lg bg-[#111111] px-3 py-2 text-xs font-medium text-white hover:bg-[#ff7f00]">
                      <Plus size={14} />
                      {uiText.peers.addPeer}
                    </button>
                  </div>

                  {isAddingPeer && (
                    <div className="axis-soft-card mb-4 rounded-lg bg-white/88 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-black">{uiText.peers.addPeerTitle}</p>
                        <button onClick={() => setIsAddingPeer(false)} className="rounded p-1 text-neutral-500 hover:bg-white hover:text-black">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input value={newPeerName} onChange={(e) => setNewPeerName(e.target.value)} placeholder={uiText.peers.companyPlaceholder} className="axis-input w-full rounded-lg bg-white/92 px-3 py-2 text-sm" />
                        <input value={newPeerKeywords} onChange={(e) => setNewPeerKeywords(e.target.value)} placeholder={uiText.peers.keywordPlaceholder} className="axis-input w-full rounded-lg bg-white/92 px-3 py-2 text-sm" />
                        <button onClick={handleAddPeer} disabled={!newPeerName.trim()} className="w-full rounded-lg bg-[#ff7f00] px-3 py-2 text-sm font-medium text-white hover:bg-[#db6c01] disabled:cursor-not-allowed disabled:bg-neutral-300">
                          {uiText.peers.register}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {peers.map((peer) => (
                      <button key={peer.id} onClick={() => setSelectedPeer(peer)} className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activePeer?.id === peer.id ? 'border border-[#ff7f00]/20 bg-[#ff7f00]/6' : 'axis-soft-card hover:bg-white/80'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-black">{peer.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            peer.priority === 'high' ? 'bg-[#E1002A]/10 text-[#E1002A]' : 'bg-[#ff7f00]/10 text-[#d96200]'
                          }`}>
                            {peer.priority === 'high' ? uiText.peers.high : uiText.peers.medium}
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs text-neutral-600">
                          <span>{uiText.peers.primary} {peer.stats.primary}</span>
                          <span>{uiText.peers.watch} {peer.stats.watch}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-9">
                {activePeer ? <PeerIrAnalysis peer={activePeer} period={period} periodValue={periodValue} analyses={peersData.analyses} /> : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function PeerIrAnalysis({
  peer,
  period,
  periodValue,
  analyses,
}: {
  peer: PeerSummary;
  period: PeriodFilter;
  periodValue: string;
  analyses: Record<string, { source: string; title: string; summary: string; highlightsTitle: string; highlights: string[]; pillars: Array<{ name: string; details: string[] }> }>;
}) {
  const analysis = analyses[peer.id];

  if (!analysis) {
    return (
      <section className="axis-panel rounded-xl border-dashed p-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-neutral-100">
          <Building2 className="size-6 text-neutral-500" />
        </div>
        <h2 className="text-xl font-bold text-black">{peer.name} {uiText.peers.noAnalysisTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">{uiText.peers.noAnalysisBody}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="axis-panel bg-white/82 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#ff7f00]/10 px-2 py-1 text-xs font-medium text-[#d96200]">{analysis.source}</span>
              <span className="rounded bg-[#ff7f00]/10 px-2 py-1 text-xs font-medium text-[#d96200]">{peer.name}</span>
              <span className="rounded bg-white/76 px-2 py-1 text-xs font-medium text-black/54">{period} · {periodValue}</span>
            </div>
            <h2 className="text-2xl font-bold text-black">{analysis.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-700">{analysis.summary}</p>
            <p className="mt-3 text-sm text-neutral-600">{peer.implication}</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#ff7f00]">
            <BarChart3 className="size-6 text-white" />
          </div>
        </div>
        <div className="axis-soft-card rounded-xl bg-white/86 p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold text-black">{analysis.highlightsTitle}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {analysis.highlights.map((item, index) => (
              <div key={item} className="axis-soft-card rounded-lg bg-white/92 p-3">
                <span className="mb-2 inline-flex size-6 items-center justify-center rounded-full bg-[#ff7f00] text-xs font-bold text-white">{index + 1}</span>
                <p className="text-xs leading-relaxed text-neutral-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {analysis.pillars.map((pillar, index) => (
          <div key={pillar.name} className="axis-panel bg-white/82 p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">{index + 1}</span>
              <div>
                <h3 className="text-base font-bold text-black">{pillar.name}</h3>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pillar.details.map((detail) => (
                <div key={detail} className="axis-soft-card rounded-lg bg-white/72 px-3 py-2 text-xs leading-relaxed text-neutral-700">{detail}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
