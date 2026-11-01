'use client';
import type { CSSProperties, PointerEventHandler, ReactNode } from 'react';

export type CatalogItem = {
  id: string;
  name: string;
  preview: ReactNode;
  fixed?: boolean;
  count?: number;
  stored: boolean;
};
export function ItemCatalog({
  items,
  tab,
  selected,
  left,
  onTab,
  onSelect,
  onPlace,
  onStore,
  onClose,
  onMoveInRoom,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
}: {
  items: CatalogItem[];
  tab: 'placed' | 'stored';
  selected: string | null;
  left: number;
  onTab: (tab: 'placed' | 'stored') => void;
  onSelect: (id: string) => void;
  onPlace: (id: string) => void;
  onStore: (id: string) => void;
  onClose: () => void;
  onMoveInRoom: () => void;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onPointerMove?: PointerEventHandler<HTMLElement>;
  onPointerEnd?: PointerEventHandler<HTMLElement>;
}) {
  // Membership is supplied from the existing room state; the catalog never saves furniture.
  const placeAndMove = (id: string) => {
    onPlace(id);
    onMoveInRoom();
  };
  return (
    <section
      className="item-note furniture-catalog"
      aria-label="アイテム"
      style={
        {
          left: `clamp(8px, ${left}%, calc(100% - var(--catalog-width) - 8px))`,
        } as CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <header className="catalog-heading">
        <div className="item-note-drag-handle">
          <small>おへやづくり</small>
          <h2>アイテム</h2>
        </div>
        <button
          type="button"
          className="catalog-close"
          aria-label="アイテムを閉じる"
          onClick={onClose}
        >
          完了
        </button>
      </header>
      <div className="item-tabs" role="tablist" aria-label="アイテムの状態">
        {(['placed', 'stored'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls={`catalog-${value}`}
            id={`catalog-tab-${value}`}
            className={tab === value ? 'active' : ''}
            onClick={() => onTab(value)}
          >
            {value === 'placed' ? '配置中' : '収納中'}{' '}
            <span>
              {
                items.filter((item) => item.stored === (value === 'stored'))
                  .length
              }
            </span>
          </button>
        ))}
      </div>
      <div
        className="item-card-list"
        role="tabpanel"
        id={`catalog-${tab}`}
        aria-labelledby={`catalog-tab-${tab}`}
        tabIndex={0}
      >
        {items
          .filter((item) => item.stored === (tab === 'stored'))
          .map((item) => (
            <article
              className={`item-tile${selected === item.id ? ' selected' : ''}${item.fixed ? ' item-tile-special' : ''}`}
              key={item.id}
            >
              {item.fixed && <span className="catalog-tag">固定アイテム</span>}
              {selected === item.id && (
                <span className="catalog-selected">選択中</span>
              )}
              <button
                className="item-tile-main"
                type="button"
                aria-pressed={selected === item.id}
                aria-label={`${item.name}を${tab === 'stored' ? '部屋に置く' : '部屋で確認する'}`}
                onClick={() =>
                  tab === 'stored' ? placeAndMove(item.id) : onSelect(item.id)
                }
              >
                <span className="item-tile-preview">{item.preview}</span>
                <span className="item-tile-name">{item.name}</span>
                {item.count && item.count > 1 ? (
                  <small className="item-tile-owned-count">
                    所持 ×{item.count}
                  </small>
                ) : null}
              </button>
              {item.fixed ? (
                <button
                  className="item-tile-action catalog-fixed-action"
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    onMoveInRoom();
                  }}
                >
                  部屋で動かす
                </button>
              ) : (
                <button
                  className="item-tile-action"
                  type="button"
                  onClick={() =>
                    tab === 'stored' ? placeAndMove(item.id) : onStore(item.id)
                  }
                >
                  {tab === 'stored' ? '配置する' : 'しまう'}
                </button>
              )}
            </article>
          ))}
        {!items.some((item) => item.stored === (tab === 'stored')) && (
          <p className="item-list-empty">
            {tab === 'stored'
              ? '収納中のアイテムはありません。'
              : '収納中から、家具を選んでみよう。'}
          </p>
        )}
      </div>
      <footer className="catalog-footer">
        <span>↕ スクロールして選ぶ</span>
        {selected && (
          <button type="button" onClick={onMoveInRoom}>
            部屋で動かす →
          </button>
        )}
      </footer>
    </section>
  );
}
