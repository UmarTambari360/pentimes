import { gql } from 'graphql-request';

/**
 * Lightweight queries for sitemap generation.
 * We only fetch what's needed — slug + dates — to keep sitemap
 * generation fast even with thousands of articles.
 */

export const GET_SITEMAP_ARTICLES = gql`
  query GetSitemapArticles($filters: ArticleFiltersInput) {
    articles(filters: $filters) {
      items {
        slug
        updatedAt
        publishedAt
      }
      total
    }
  }
`;

export const GET_SITEMAP_CATEGORIES = gql`
  query GetSitemapCategories {
    categories {
      slug
      createdAt
    }
  }
`;