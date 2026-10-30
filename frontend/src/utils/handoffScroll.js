export function getHandoffScrollProgress({
  sceneTop,
  sceneHeight,
  panelHeight,
  viewportTop = 0,
  stickyInset = 0,
} = {}) {
  if (
    ![sceneTop, sceneHeight, panelHeight, viewportTop, stickyInset].every(Number.isFinite)
    || sceneHeight <= 0
    || panelHeight <= 0
  ) {
    return 0;
  }

  const scrollTrack = Math.max(1, sceneHeight - panelHeight);
  const progress = (viewportTop + stickyInset - sceneTop) / scrollTrack;

  return Math.min(1, Math.max(0, progress));
}
