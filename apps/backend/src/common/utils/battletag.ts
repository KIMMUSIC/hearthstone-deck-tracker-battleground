/**
 * Parse BattleTag from URL parameter format.
 * URL uses `-` as separator since `#` is not URL-safe.
 * e.g., "Player-1234" → "Player#1234"
 */
export function parseBattleTag(urlParam: string): string {
  const lastDashIndex = urlParam.lastIndexOf('-');
  if (lastDashIndex === -1) {
    return urlParam;
  }
  const name = urlParam.substring(0, lastDashIndex);
  const discriminator = urlParam.substring(lastDashIndex + 1);
  return `${name}#${discriminator}`;
}

/**
 * Convert BattleTag to URL-safe format.
 * e.g., "Player#1234" → "Player-1234"
 */
export function battleTagToUrlParam(battleTag: string): string {
  return battleTag.replace('#', '-');
}
