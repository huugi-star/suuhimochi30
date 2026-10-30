'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { DailyMissionId, DailyMissionSummary } from '@/lib/dailyMissions';
import { DailyMissionCoin } from './DailyMissionCoin';
import styles from './DailyMissionBoard.module.css';

function MissionPostArt() {
  return <>
        <span className={styles.post} aria-hidden="true">
          <span className={styles.letter} />
          <span className={styles.door}>
            <span className={styles.slot}><span className={styles.slotLetter}>
              <svg viewBox="0 0 24 20" shapeRendering="crispEdges" focusable="false">
                <path d="M0 0h24v20H0z" fill="#9c7849" />
                <path d="M1 1h22v18H1z" fill="#fff2cf" />
                <path d="M2 2h2v2h3v2h3v2h4V6h3V4h3V2h2v2h-2v2h-3v2h-3v2h-4V8H7V6H4V4H2z" fill="#c4a36c" />
                <path d="M10 6h4v1h1v3h-1v1h-4v-1H9V7h1z" fill="#b93d35" />
                <path d="M10 7h2v1h-2z" fill="#e4775b" />
              </svg>
            </span></span>
            <svg className={styles.envelope} viewBox="0 0 28 20" fill="none" focusable="false"><path d="M2 2h24v16H2z" /><path d="m2 2 12 9L26 2M2 18l8-8m16 8-8-8" /></svg>
            <span className={styles.knob} />
          </span>
          <span className={styles.roof} />
        </span>
        <span className={styles.sign}>ミッション</span>
  </>;
}
export function MissionPostPreview() { return <span className={styles.preview} aria-hidden="true"><MissionPostArt /></span>; }
export function DailyMissionBoard({ summary, visible = true, portrait = false, onOpenChange, onCoinPresented, onMission, onCelebrated, openRequest = 0, onOpenRequestHandled, disabledMissions, position, editing = false, selected = false, onEditPointerDown, onEditPointerMove, onEditPointerEnd }: {
  summary: DailyMissionSummary; visible?: boolean; portrait?: boolean;
  onOpenChange: (open: boolean) => void; onOpenJournal: () => void;
  onCoinPresented?: () => void;
  onMission?: (id: DailyMissionId) => void; onCelebrated?: (ids: DailyMissionId[]) => void;
  openRequest?: number; onOpenRequestHandled?: () => void; disabledMissions?: Partial<Record<DailyMissionId, string>>;
  position?: { x: number; y: number }; editing?: boolean; selected?: boolean;
  onEditPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onEditPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onEditPointerEnd?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [postOpen, setPostOpen] = useState(false);
  const hasPendingMissions = summary.completed < summary.total;
  useEffect(() => {
    if (!visible || editing || !openRequest) return;
    if (!dialog.current?.open) { setPostOpen(true); dialog.current?.showModal(); onOpenChange(true); }
    onOpenRequestHandled?.();
  }, [openRequest, visible, editing, onOpenChange, onOpenRequestHandled]);
  useEffect(() => () => onOpenChange(false), [onOpenChange]);
  const open = () => { if (!dialog.current?.open) { setPostOpen(true); dialog.current?.showModal(); onOpenChange(true); } };
  const close = () => dialog.current?.close();
  return <>
    <div className={`${styles.board}${portrait ? ` ${styles.portrait}` : ''}`} hidden={!visible} data-mission-board data-mission-post data-open={postOpen} data-editing={editing} data-selected={selected} data-pending={hasPendingMissions}
      data-room-item-id={portrait ? undefined : 'mission-post'} style={!portrait && position ? { left: `clamp(8px, ${position.x}%, calc(100% - 72px))`, top: `clamp(56px, ${position.y}%, calc(100% - 84px))` } : undefined}
      onPointerDown={editing ? onEditPointerDown : undefined} onPointerMove={editing ? onEditPointerMove : undefined}
      onPointerUp={editing ? onEditPointerEnd : undefined} onPointerCancel={editing ? onEditPointerEnd : undefined}>
      <button type="button" className={styles.postButton} onClick={() => { if (!editing) open(); }} title={editing ? 'ドラッグで移動（収納できません）' : undefined} aria-label={editing ? 'ミッションポストを移動' : 'ミッションポストを開く'} aria-haspopup="dialog" aria-expanded={postOpen}>
        <MissionPostArt />
        <span className={styles.srOnly} aria-label="デイリーミッション達成数">{summary.completed} / {summary.total}</span>
        <span className={styles.srOnly}>{hasPendingMissions ? '未達成のミッションがあります' : 'ミッションをすべて達成しました'}</span>
      </button>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-label="デイリーミッション" onClose={() => { setPostOpen(false); onOpenChange(false); }}
      onCancel={() => onOpenChange(false)} onKeyDown={event => event.stopPropagation()}
      onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <section className={styles.detailPaper}>
        <button type="button" className={styles.close} onClick={close} aria-label="ミッションの詳細を閉じる">×</button>
        <p className={styles.date}>{summary.date.replaceAll('-', ' / ')}</p>
        <h2 id="daily-mission-details-title">デイリーミッション<span className={styles.headingCount} aria-hidden="true">{summary.completed}/6</span></h2>
        {postOpen && <DailyMissionCoin key={summary.date} summary={summary} onPresented={onCoinPresented} onCelebrated={onCelebrated} disabledMissions={disabledMissions}
          onMission={id => { close(); onMission?.(id); }} />}
      </section>
    </dialog>
  </>;
}
