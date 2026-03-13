const HEARTHSTONE_JSON_CDN = 'https://art.hearthstonejson.com/v1/256x';

export function getHeroImageUrl(cardId: string): string {
  return `${HEARTHSTONE_JSON_CDN}/${cardId}.jpg`;
}

export function getHeroPortraitUrl(cardId: string): string {
  return `${HEARTHSTONE_JSON_CDN}/${cardId}.jpg`;
}

export const PLACEHOLDER_HERO_IMAGE = '/images/hero-placeholder.png';

export function getHeroImageWithFallback(cardId: string): string {
  if (!cardId) return PLACEHOLDER_HERO_IMAGE;
  return getHeroImageUrl(cardId);
}
