import type { Metadata } from 'next';

const SITE_NAME = 'BG Tracker';
const SITE_DESCRIPTION = '하스스톤 전장 전적 검색 & 메타 통계';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bgtracker.gg';

export const defaultMetadata: Metadata = {
  title: {
    default: `${SITE_NAME} - ${SITE_DESCRIPTION}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function generateUserMetadata(battleTag: string): Metadata {
  const title = `${battleTag} - 전적`;
  const description = `${battleTag}의 하스스톤 전장 전적, MMR, 영웅 통계`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/${battleTag.replace('#', '-')}`,
    },
    twitter: {
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export function generateMetaPageMetadata(): Metadata {
  const title = '메타 통계';
  const description = '하스스톤 전장 영웅 티어 리스트 & 종족 분석';

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}
