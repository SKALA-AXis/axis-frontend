import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import type { AdminCard } from '../model/adminCard';
import { ExecutiveBadge, ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { TableStateRow } from '../../../app/components/shared/PageState';
import { PageWindowPagination } from '../../../app/components/shared/PageWindowPagination';
import { formatLastLogin } from '../../admin-users/lib/adminFormat';
import { readHiddenCardIds, writeHiddenCardIds } from '../lib/hiddenCards';

// 삭제 카드뉴스 관리 패널 (refactoring P2/stage3 하드분할). AdminView 에서 이동.
export function AdminDeletedCardsPanel({
  cards,
  isLoading,
  error,
  updatingCardId,
  onReload,
  onRestore,
}: {
  cards: AdminCard[];
  isLoading: boolean;
  error: string | null;
  updatingCardId: string | null;
  onReload: () => void;
  onRestore: (cardId: string, reason: string) => Promise<void>;
}) {
  const hiddenStorageKey = 'axis.admin.deleted-card-news.hidden-ids';
  const [listMode, setListMode] = useState<'VISIBLE' | 'HIDDEN'>('VISIBLE');
  const [hiddenCardIds, setHiddenCardIds] = useState<string[]>(() => readHiddenCardIds(hiddenStorageKey));
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const hiddenCardIdSet = useMemo(() => new Set(hiddenCardIds), [hiddenCardIds]);
  const selectedCardIdSet = useMemo(() => new Set(selectedCardIds), [selectedCardIds]);
  const visibleCards = useMemo(() => cards.filter((card) => !hiddenCardIdSet.has(card.id)), [cards, hiddenCardIdSet]);
  const hiddenCards = useMemo(() => cards.filter((card) => hiddenCardIdSet.has(card.id)), [cards, hiddenCardIdSet]);
  const displayCards = useMemo(
    () => (listMode === 'VISIBLE' ? visibleCards : hiddenCards),
    [hiddenCards, listMode, visibleCards],
  );
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(displayCards.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageCards = displayCards.slice(pageStart, pageStart + pageSize);
  const pageCardIds = pageCards.map((card) => card.id);
  const selectedCount = selectedCardIds.length;
  const allRowsSelected = pageCardIds.length > 0 && pageCardIds.every((id) => selectedCardIdSet.has(id));
  const setPageSafely = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  };

  useEffect(() => {
    writeHiddenCardIds(hiddenStorageKey, hiddenCardIds);
  }, [hiddenStorageKey, hiddenCardIds]);

  useEffect(() => {
    setSelectedCardIds([]);
    setCurrentPage(1);
  }, [listMode]);

  useEffect(() => {
    const displayCardIdSet = new Set(displayCards.map((card) => card.id));
    setSelectedCardIds((currentIds) => {
      const nextIds = currentIds.filter((id) => displayCardIdSet.has(id));
      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
  }, [displayCards]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleCard = (cardId: string) => {
    setSelectedCardIds((currentIds) => (
      currentIds.includes(cardId)
        ? currentIds.filter((id) => id !== cardId)
        : [...currentIds, cardId]
    ));
  };

  const togglePageCards = () => {
    setSelectedCardIds((currentIds) => {
      if (allRowsSelected) {
        return currentIds.filter((id) => !pageCardIds.includes(id));
      }
      return Array.from(new Set([...currentIds, ...pageCardIds]));
    });
  };

  const hideSelectedCards = () => {
    if (selectedCount === 0) {
      window.alert('삭제할 카드뉴스를 선택해주세요.');
      return;
    }
    const confirmed = window.confirm(`선택한 카드뉴스 ${selectedCount}건을 삭제 목록에서 숨길까요?`);
    if (!confirmed) {
      return;
    }
    setHiddenCardIds((currentIds) => Array.from(new Set([...currentIds, ...selectedCardIds])));
    setSelectedCardIds([]);
    setCurrentPage(1);
  };

  const hideAllCards = () => {
    if (visibleCards.length === 0) {
      return;
    }
    const confirmed = window.confirm(`삭제 목록의 카드뉴스 ${visibleCards.length}건을 모두 숨길까요?`);
    if (!confirmed) {
      return;
    }
    setHiddenCardIds((currentIds) => Array.from(new Set([...currentIds, ...visibleCards.map((card) => card.id)])));
    setSelectedCardIds([]);
    setCurrentPage(1);
  };

  const restoreSelectedToList = () => {
    if (selectedCount === 0) {
      window.alert('복구할 카드뉴스를 선택해주세요.');
      return;
    }
    setHiddenCardIds((currentIds) => currentIds.filter((id) => !selectedCardIdSet.has(id)));
    setSelectedCardIds([]);
    setCurrentPage(1);
  };

  const restoreAllToList = () => {
    setHiddenCardIds([]);
    setSelectedCardIds([]);
    setCurrentPage(1);
  };

  const handleRestore = async (card: AdminCard) => {
    const reason = window.prompt(`"${card.title}" 카드뉴스 복구 사유를 입력해주세요.`);
    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      window.alert('복구 사유를 입력해주세요.');
      return;
    }

    const confirmed = window.confirm(`"${card.title}" 카드뉴스를 복구할까요?`);
    if (!confirmed) {
      return;
    }

    try {
      await onRestore(card.id, trimmedReason);
      setHiddenCardIds((currentIds) => currentIds.filter((id) => id !== card.id));
      setSelectedCardIds((currentIds) => currentIds.filter((id) => id !== card.id));
    } catch {
      // Hook error state is surfaced in the panel.
    }
  };

  return (
    <section data-guide="admin-cards">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="axis-kicker">Card news management</p>
          <h2 className="axis-section-heading mt-1">삭제된 카드뉴스 확인 · 복구</h2>
        </div>
        <ExecutiveButton variant="secondary" icon={<RefreshCw size={16} />} onClick={onReload}>
          새로고침
        </ExecutiveButton>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setListMode('VISIBLE')}
              className={`rounded-[var(--axis-radius-sm)] border px-3 py-2 text-sm font-semibold transition ${
                listMode === 'VISIBLE'
                  ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                  : 'border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]'
              }`}
            >
              삭제 목록
            </button>
            <button
              type="button"
              onClick={() => setListMode('HIDDEN')}
              className={`rounded-[var(--axis-radius-sm)] border px-3 py-2 text-sm font-semibold transition ${
                listMode === 'HIDDEN'
                  ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                  : 'border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]'
              }`}
            >
              숨긴 항목
            </button>
            <ExecutiveBadge tone="warning">삭제된 카드뉴스 {cards.length}건</ExecutiveBadge>
            <ExecutiveBadge tone={listMode === 'VISIBLE' ? 'neutral' : 'accent'}>
              {listMode === 'VISIBLE' ? '삭제 목록' : '숨긴 항목'} {displayCards.length}건
            </ExecutiveBadge>
            {selectedCount > 0 ? <ExecutiveBadge tone="accent">선택 {selectedCount}건</ExecutiveBadge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listMode === 'VISIBLE' ? (
              <>
                <ExecutiveButton
                  variant="danger"
                  icon={<Trash2 size={15} />}
                  disabled={selectedCount === 0}
                  onClick={hideSelectedCards}
                >
                  선택 삭제
                </ExecutiveButton>
                <ExecutiveButton
                  variant="danger"
                  icon={<Trash2 size={15} />}
                  disabled={visibleCards.length === 0}
                  onClick={hideAllCards}
                >
                  전체 삭제
                </ExecutiveButton>
              </>
            ) : (
              <>
                <ExecutiveButton
                  variant="secondary"
                  icon={<RotateCcw size={15} />}
                  disabled={selectedCount === 0}
                  onClick={restoreSelectedToList}
                >
                  선택 복구
                </ExecutiveButton>
                <ExecutiveButton
                  variant="secondary"
                  icon={<RotateCcw size={15} />}
                  disabled={hiddenCards.length === 0}
                  onClick={restoreAllToList}
                >
                  전체 복구
                </ExecutiveButton>
              </>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-[var(--axis-radius-md)] border border-[rgba(218,30,40,0.18)] bg-[rgba(218,30,40,0.08)] px-4 py-3 text-sm text-[var(--axis-danger)]">
          {error}
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4 text-sm font-semibold text-[var(--axis-muted)]">
            삭제된 카드뉴스를 불러오는 중입니다.
          </div>
        ) : displayCards.length === 0 ? (
          <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4 text-sm font-semibold text-[var(--axis-muted)]">
            {listMode === 'VISIBLE' ? '삭제 목록에 카드뉴스가 없습니다.' : '숨긴 항목이 없습니다.'}
          </div>
        ) : pageCards.map((card) => (
          <article key={card.id} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedCardIdSet.has(card.id)}
                onChange={() => toggleCard(card.id)}
                aria-label={`${card.title} 선택`}
                className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--axis-hairline)]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--axis-accent-strong)]">{card.peerId}</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                <dt className="font-semibold text-[var(--axis-muted)]">삭제 사유</dt>
                <dd className="min-w-0 text-[var(--axis-body)]">{card.deletionReason || '-'}</dd>
              </div>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                <dt className="font-semibold text-[var(--axis-muted)]">관리자</dt>
                <dd className="min-w-0 break-all text-[var(--axis-body)]">{card.deletedBy || '-'}</dd>
              </div>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                <dt className="font-semibold text-[var(--axis-muted)]">삭제 시각</dt>
                <dd className="min-w-0 text-[var(--axis-body)]">{formatLastLogin(card.deletedAt)}</dd>
              </div>
            </dl>
            <div className="mt-4">
              {listMode === 'VISIBLE' ? (
                <button
                  type="button"
                  disabled={updatingCardId === card.id}
                  onClick={() => void handleRestore(card)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RotateCcw size={14} />
                  복구
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHiddenCardIds((currentIds) => currentIds.filter((id) => id !== card.id));
                    setSelectedCardIds((currentIds) => currentIds.filter((id) => id !== card.id));
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                >
                  <RotateCcw size={14} />
                  목록으로 복구
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white md:block">
        <table className="axis-data-table min-w-[920px]">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={allRowsSelected}
                  disabled={isLoading || pageCards.length === 0}
                  onChange={togglePageCards}
                  aria-label="현재 페이지 카드뉴스 전체 선택"
                  className="h-4 w-4 rounded border-[var(--axis-hairline)]"
                />
              </th>
              <th>제목</th>
              <th>Peer사</th>
              <th>삭제 사유</th>
              <th>삭제한 관리자</th>
              <th>삭제 시각</th>
              <th>복구</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableStateRow colSpan={7} label="삭제된 카드뉴스를 불러오는 중입니다." skeleton />
            ) : displayCards.length === 0 ? (
              <TableStateRow colSpan={7} label={listMode === 'VISIBLE' ? '삭제 목록에 카드뉴스가 없습니다.' : '숨긴 항목이 없습니다.'} />
            ) : pageCards.map((card) => (
              <tr key={card.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCardIdSet.has(card.id)}
                    onChange={() => toggleCard(card.id)}
                    aria-label={`${card.title} 선택`}
                    className="h-4 w-4 rounded border-[var(--axis-hairline)]"
                  />
                </td>
                <td className="font-semibold text-[var(--axis-ink)]">{card.title}</td>
                <td>{card.peerId}</td>
                <td>{card.deletionReason || '-'}</td>
                <td>{card.deletedBy || '-'}</td>
                <td>{formatLastLogin(card.deletedAt)}</td>
                <td>
                  {listMode === 'VISIBLE' ? (
                    <button
                      type="button"
                      disabled={updatingCardId === card.id}
                      onClick={() => void handleRestore(card)}
                      className="inline-flex items-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <RotateCcw size={14} />
                      복구
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setHiddenCardIds((currentIds) => currentIds.filter((id) => id !== card.id));
                        setSelectedCardIds((currentIds) => currentIds.filter((id) => id !== card.id));
                      }}
                      className="inline-flex items-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                    >
                      <RotateCcw size={14} />
                      목록으로 복구
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PageWindowPagination
        className="mt-4 mb-40"
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPageSafely}
        ariaLabel="삭제된 카드뉴스 페이지 이동"
      />
    </section>
  );
}
