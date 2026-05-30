import { gql } from 'graphql-request';

export const ARTICLE_CARD_FIELDS = gql`
  fragment ArticleCardFields on Article {
    id
    title
    slug
    excerpt
    coverImage
    status
    views
    readingTime
    publishedAt
    createdAt
    author {
      id
      name
      avatar
    }
    categories {
      id
      name
      slug
    }
    likeCount
    commentCount
    isLiked
    isBookmarked
  }
`;

export const ARTICLE_FULL_FIELDS = gql`
  fragment ArticleFullFields on Article {
    id
    title
    slug
    excerpt
    content
    coverImage
    status
    views
    readingTime
    publishedAt
    createdAt
    updatedAt
    author {
      id
      name
      avatar
      bio
    }
    categories {
      id
      name
      slug
    }
    likeCount
    commentCount
    isLiked
    isBookmarked
  }
`;

export const GET_ARTICLES = gql`
  ${ARTICLE_CARD_FIELDS}
  query GetArticles($filters: ArticleFiltersInput) {
    articles(filters: $filters) {
      items {
        ...ArticleCardFields
      }
      total
      hasMore
    }
  }
`;

export const GET_ARTICLE = gql`
  ${ARTICLE_FULL_FIELDS}
  query GetArticle($slug: String!) {
    article(slug: $slug) {
      ...ArticleFullFields
    }
  }
`;

export const GET_ARTICLE_BY_ID = gql`
  ${ARTICLE_FULL_FIELDS}
  query GetArticles($filters: ArticleFiltersInput) {
    articles(filters: $filters) {
      items {
        ...ArticleFullFields
      }
      total
    }
  }
`;

export const SEARCH_ARTICLES = gql`
  ${ARTICLE_CARD_FIELDS}
  query SearchArticles($query: String!, $limit: Int, $offset: Int) {
    searchArticles(query: $query, limit: $limit, offset: $offset) {
      items {
        ...ArticleCardFields
      }
      total
      hasMore
    }
  }
`;

export const CREATE_ARTICLE = gql`
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id
      slug
      title
      status
    }
  }
`;

export const UPDATE_ARTICLE = gql`
  mutation UpdateArticle($id: String!, $input: UpdateArticleInput!) {
    updateArticle(id: $id, input: $input) {
      id
      slug
      title
      status
    }
  }
`;

export const DELETE_ARTICLE = gql`
  mutation DeleteArticle($id: String!) {
    deleteArticle(id: $id)
  }
`;

export const TOGGLE_LIKE = gql`
  mutation ToggleLike($articleId: String!) {
    toggleLike(articleId: $articleId) {
      liked
      likeCount
    }
  }
`;

export const TOGGLE_BOOKMARK = gql`
  mutation ToggleBookmark($articleId: String!) {
    toggleBookmark(articleId: $articleId) {
      bookmarked
    }
  }
`;

export const GET_MY_BOOKMARKS = gql`
  ${ARTICLE_CARD_FIELDS}
  query GetMyBookmarks($limit: Int, $offset: Int) {
    myBookmarks(limit: $limit, offset: $offset) {
      ...ArticleCardFields
    }
  }
`;