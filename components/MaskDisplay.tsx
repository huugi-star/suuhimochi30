import type { PersonaStage } from '@/lib/food';

export type MaskGrowthStage = PersonaStage;

export type MaskArtwork = {
  id: string;
  src: string;
  alt: string;
};

export const MASK_ARTWORKS: readonly MaskArtwork[] = [
  { id: 'kamen-0', src: '/assets/kamen/kamen-0.png', alt: '育っていく仮面' },
] as const;

export const DEFAULT_MASK_ARTWORK = MASK_ARTWORKS[0];

type MaskDisplayProps = {
  artwork?: MaskArtwork;
  stage: MaskGrowthStage;
  growing?: boolean;
  compact?: boolean;
};

/**
 * The frame, mask and glass are deliberately separate layers. New masks can
 * be added to MASK_ARTWORKS without changing the room-item implementation.
 */
export function MaskDisplay({
  artwork = DEFAULT_MASK_ARTWORK,
  stage,
  growing = false,
  compact = false,
}: MaskDisplayProps) {
  return (
    <span
      className={`mask-case mask-stage-${stage}${growing ? ' mask-case-growing' : ''}${compact ? ' mask-case-compact' : ''}`}
      data-mask-id={artwork.id}
      data-mask-stage={stage}
      aria-label={`${artwork.alt}、成長段階${stage}`}
    >
      <img className="mask-frame mask-frame-base" src="/assets/kamen/kamen-frame/kamen-frame.png" alt="" draggable={false} />
      <span className="mask-display-area">
        <img className="mask-item" src={artwork.src} alt="" draggable={false} />
        <span className="mask-case-glass" aria-hidden="true" />
      </span>
      <span className="mask-frame-front" aria-hidden="true">
        <img className="mask-frame-edge mask-frame-edge-top" src="/assets/kamen/kamen-frame/kamen-frame.png" alt="" draggable={false} />
        <img className="mask-frame-edge mask-frame-edge-right" src="/assets/kamen/kamen-frame/kamen-frame.png" alt="" draggable={false} />
        <img className="mask-frame-edge mask-frame-edge-bottom" src="/assets/kamen/kamen-frame/kamen-frame.png" alt="" draggable={false} />
        <img className="mask-frame-edge mask-frame-edge-left" src="/assets/kamen/kamen-frame/kamen-frame.png" alt="" draggable={false} />
      </span>
    </span>
  );
}
