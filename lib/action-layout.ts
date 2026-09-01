export const ACTION_LAYOUT = {
  primaryMinHeight: 52,
  secondaryMinHeight: 48,
  primaryRadius: 16,
  dockBottomPadding: 16,
  compactWidth: 320,
  compactHeight: 568,
} as const;

export const getLayoutStressCase = (width: number, height: number) => ({
  isCompact: width <= ACTION_LAYOUT.compactWidth || height <= ACTION_LAYOUT.compactHeight,
  isLandscape: width > height,
  requiresScrollableContent: width <= ACTION_LAYOUT.compactWidth || height <= ACTION_LAYOUT.compactHeight || width > height,
});
