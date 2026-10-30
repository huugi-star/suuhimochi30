export type BubbleRect = { left: number; top: number; width: number; height: number };
const right = (r: BubbleRect) => r.left + r.width, bottom = (r: BubbleRect) => r.top + r.height;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(Math.max(a, b), n));
const overlap = (a: BubbleRect, b: BubbleRect) => Math.max(0, Math.min(right(a), right(b)) - Math.max(a.left, b.left))
  * Math.max(0, Math.min(bottom(a), bottom(b)) - Math.max(a.top, b.top));

/** Screen-space placement only. Character/camera/movement remain owned by the existing game. */
export function externalBubbleLayout(view: BubbleRect, character: BubbleRect, height: number, obstacles: BubbleRect[] = []) {
  const face = { x: character.left + character.width / 2, y: character.top + character.height * .4 };
  const preferred = face.x < view.left + view.width / 2 ? 'right' : 'left';
  const candidates: Array<BubbleRect & { side: 'right' | 'left'; score: number }> = [];
  for (const side of ['right', 'left'] as const) {
    const available = side === 'right' ? right(view) - right(character) - 18 : character.left - view.left - 18;
    const width = Math.min(440, Math.max(160, available), view.width);
    const left = clamp(side === 'right' ? right(character) + 18 : character.left - width - 18, view.left, right(view) - width);
    const h = Math.min(height, view.height);
    for (const proposed of [face.y - h * .4, view.top, bottom(view) - h, ...obstacles.flatMap((o) => [bottom(o) + 10, o.top - h - 10])]) {
      const box = { left, top: clamp(proposed, view.top, bottom(view) - h), width, height: h };
      const score = overlap(box, character) * 1000 + obstacles.reduce((sum, o) => sum + overlap(box, o) * 100, 0)
        + (side === preferred ? 0 : 10000) + Math.abs(box.top + h * .4 - face.y);
      candidates.push({ ...box, side, score });
    }
  }
  const box = candidates.sort((a, b) => a.score - b.score)[0];
  const x = box.side === 'right' ? 0 : box.width;
  const y = clamp(face.y - box.top, 22, box.height - 22);
  // Keep the pointer aimed at the face, but limit its reach and widen the
  // base so the tail reads as a short speech-bubble nib rather than a long
  // needle stretching across the room.
  const faceX = face.x + (box.side === 'right' ? 1 : -1) * character.width * .12 - box.left;
  const dx = faceX - x;
  const dy = face.y - box.top - y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(26, distance);
  const tipX = x + (distance ? dx / distance * reach : 0);
  const tipY = y + (distance ? dy / distance * reach : 0);
  return { ...box, points: `${x},${y - 18} ${tipX},${tipY} ${x},${y + 18}` };
}
