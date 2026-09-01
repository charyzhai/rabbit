export type WordMatchTargetBox = { x: number; y: number; width: number; height: number };

export const getDropTargetId = (boxes: Record<string, WordMatchTargetBox>, x: number, y: number) => Object.entries(boxes).find(([, box]) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height)?.[0];
