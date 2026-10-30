'use client';
import { cloneElement, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { externalBubbleLayout } from '@/lib/externalBubbleLayout';
import type { ExternalCitation } from '@/lib/externalSourceCitation';
import { safeCitationUrl } from '@/lib/externalSourceCitation';
import styles from './ExternalSourceCaption.module.css';

export function ExternalSourceCaption({ citation }: { citation: ExternalCitation }) {
  const url = safeCitationUrl(citation.url);
  if (citation.googleSearch) {
    const xUrl = safeCitationUrl(citation.xSearchUrl), articleUrl = safeCitationUrl(citation.articleUrl);
    return <small className={`${styles.caption} ${styles.googleCaption}`} data-external-source role="note" aria-label="外部話題のリンク">
      {url ? <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}
        title={citation.title} aria-label={`最近の話題をGoogleで検索・${citation.title}`}>
        <span className={styles.source}>最近の話題をGoogleで検索{citation.title ? '・' : ''}</span>
        <span className={styles.title}>{citation.title}</span>
      </a> : <span className={styles.title}>{citation.sourceName}</span>}
      {xUrl && <a href={xUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>Xで話題を見る</a>}
      {articleUrl && <a href={articleUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>関連記事</a>}
    </small>;
  }
  const source = citation.googleListing ? 'Googleトレンドで見る' : citation.sourceName;
  return <small className={styles.caption} data-external-source role="note" aria-label="元ネタ">
    <span className={styles.prefix}>元ネタ：</span>
    {url ? <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
      onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}
      title={`${citation.sourceName}・${citation.title}`} aria-label={`${source}・${citation.title}`}>
      <span className={styles.source}>{source}{citation.title ? '・' : ''}</span>
      <span className={styles.title}>{citation.title}</span>
    </a> : <span className={styles.title}>{citation.sourceName}</span>}
  </small>;
}

/** Keep the original bubble classes/handlers; a sibling anchor must never be nested in its button. */
export function ExternalSourceBubble({ citation, children }: {
  citation: ExternalCitation | null; children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
}) {
  const shell = useRef<HTMLDivElement>(null), lastClick = useRef(-Infinity);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const guardAdvance = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target as Element).closest('button')) return;
    const now = performance.now();
    if (event.detail > 1 || now - lastClick.current < 320) { event.stopPropagation(); event.preventDefault(); return; }
    lastClick.current = now;
  }, []);
  useEffect(() => {
    if (!citation || !shell.current) return;
    const game = shell.current.closest<HTMLElement>('.game-shell');
    if (game) setHost(game); // Outside the zoomed world: viewport geometry is not scaled twice.
  }, [citation]);
  useEffect(() => {
    if (!citation || !host) return;
    let frame = 0, signature = '';
    const update = () => {
      const element = shell.current, room = host.querySelector('.room'), mochi = host.querySelector('.mochi');
      if (element && room && mochi) {
        const bounds = room.getBoundingClientRect(), character = mochi.getBoundingClientRect();
        const left = Math.max(12, bounds.left + 12), top = Math.max(12, bounds.top + 12);
        const right = Math.min(innerWidth - 12, bounds.right - 12), bottom = Math.min(innerHeight - 12, bounds.bottom - 12);
        const obstacles = Array.from(host.querySelectorAll('.game-status, .room-nav, .startup-story-skip, [data-shared-source]'))
          .map((node) => node.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
        // Google may have a second row (X/article). Reserve its measured height, without moving the character/camera.
        const footer = Math.max(30, (element.querySelector('[data-external-source]')?.getBoundingClientRect().height ?? 24) + 6);
        const layout = externalBubbleLayout({ left, top, width: right - left, height: bottom - top - footer }, character,
          innerHeight < 500 ? 172 : 240, obstacles.map((o) => ({ left: o.left, top: o.top - footer, width: o.width, height: o.height + footer })));
        const next = JSON.stringify(layout);
        if (next !== signature) {
          signature = next;
          element.style.setProperty('--external-left', `${layout.left}px`);
          element.style.setProperty('--external-top', `${layout.top}px`);
          element.style.setProperty('--external-width', `${layout.width}px`);
          element.style.setProperty('--external-height', `${layout.height}px`);
          element.querySelector('[data-external-tail]')?.setAttribute('points', layout.points);
          element.dataset.externalSide = layout.side;
          element.dataset.positioned = 'true';
        }
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [citation, host]);
  if (!citation) return children;
  const content = <div ref={shell} data-external-bubble data-external-presentation="bubble" onClickCapture={guardAdvance} className={`${children.props.className ?? ''} ${styles.shell} ${styles.following}`} style={children.props.style}>
    <svg className={styles.tail} aria-hidden="true"><polygon data-external-tail /></svg>
    {cloneElement(children, { className: styles.action, style: undefined })}
    <ExternalSourceCaption citation={citation} />
  </div>;
  return host ? createPortal(content, host) : content;
}
