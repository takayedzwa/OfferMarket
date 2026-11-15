import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildBreadcrumbJsonLd,
  buildArticleJsonLd,
  articleBreadcrumbJsonLd,
  SITE_NAME,
} from '../structured-data';
import type { InsightArticleDetail } from '@/lib/api';

// ============================================================================
// STRUCTURED DATA CONTRACT (T6) — placement per URL_ARCHITECTURE Δ3d
// ============================================================================

describe('structured data builders', () => {
  it('Organization: correct type, brand name (never "Offermarket"), locale-anchored URL', () => {
    const nl = buildOrganizationJsonLd('nl') as Record<string, unknown>;
    expect(nl['@type']).toBe('Organization');
    expect(nl.name).toBe(SITE_NAME);
    expect(nl.name).not.toBe('Offermarket');
    expect(nl.url).toBe('https://offermarket.nl/');
  });

  it('WebSite: no SearchAction (retired rich result)', () => {
    const ws = buildWebSiteJsonLd('en') as Record<string, unknown>;
    expect(ws['@type']).toBe('WebSite');
    expect(ws.url).toBe('https://offermarket.eu/');
    expect(JSON.stringify(ws)).not.toContain('SearchAction');
  });

  it('breadcrumb list positions are 1-based and in order', () => {
    const bc = buildBreadcrumbJsonLd([
      { name: 'Insights', url: 'https://offermarket.eu/insights' },
      { name: 'Career', url: 'https://offermarket.eu/insights/category/career' },
    ]) as Record<string, unknown>;
    expect(bc['@type']).toBe('BreadcrumbList');
    const items = bc.itemListElement as Array<Record<string, unknown>>;
    expect(items.map((i) => i.position)).toEqual([1, 2]);
  });

  it('article: Article type (not NewsArticle), seoTitle headline, mainEntityOfPage, publisher OfferMarket', () => {
    const article = {
      id: 'a1',
      slug: 'how-offermarket-works',
      title: 'Hoe werkt OfferMarket?',
      summary: 'Uitleg.',
      category: 'career',
      skills: ['NEN 3140'],
      publishedAt: '2026-11-01T00:00:00Z',
      seoTitle: 'Hoe werkt OfferMarket? Salaris vooraf, profiel anoniem',
      metaDescription: 'Salaris vooraf, anoniem.',
    } as unknown as InsightArticleDetail;

    const ld = buildArticleJsonLd(
      article,
      'how-offermarket-works',
      'https://offermarket.nl/insights/how-offermarket-works',
    ) as Record<string, unknown>;

    expect(ld['@type']).toBe('Article');
    expect(JSON.stringify(ld)).not.toContain('NewsArticle');
    expect(ld.headline).toBe('Hoe werkt OfferMarket? Salaris vooraf, profiel anoniem');
    expect(ld.mainEntityOfPage).toBe('https://offermarket.nl/insights/how-offermarket-works');
    const publisher = ld.publisher as Record<string, unknown>;
    expect(publisher.name).toBe('OfferMarket');
    expect(ld.datePublished).toBe('2026-11-01T00:00:00Z');
  });

  it('article breadcrumb trail: Insights → category → article, locale-anchored', () => {
    const article = {
      id: 'a1',
      slug: 'how-offermarket-works',
      title: 'Hoe werkt OfferMarket?',
      category: 'career',
    } as unknown as InsightArticleDetail;

    const bc = articleBreadcrumbJsonLd(
      'nl',
      article,
      'how-offermarket-works',
      'Career',
    ) as Record<string, unknown>;
    const items = bc.itemListElement as Array<Record<string, string | number>>;
    expect(items.map((i) => i.item)).toEqual([
      'https://offermarket.nl/insights',
      'https://offermarket.nl/insights/category/career',
      'https://offermarket.nl/insights/how-offermarket-works',
    ]);
  });
});
