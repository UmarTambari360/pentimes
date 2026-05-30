import { gql } from 'graphql-request';

export const COMMENT_FIELDS = gql`
  fragment CommentFields on Comment {
    id
    body
    articleId
    createdAt
    updatedAt
    author {
      id
      name
      avatar
    }
  }
`;

export const COMMENT_WITH_CONTEXT_FIELDS = gql`
  fragment CommentWithContextFields on CommentWithContext {
    id
    body
    articleId
    createdAt
    updatedAt
    author {
      id
      name
      avatar
    }
    article {
      id
      title
      slug
    }
  }
`;

// ── Public: load comments on an article ──────────────────────────
export const GET_COMMENTS = gql`
  ${COMMENT_FIELDS}
  query GetComments($articleId: String!, $limit: Int, $offset: Int) {
    comments(articleId: $articleId, limit: $limit, offset: $offset) {
      items {
        ...CommentFields
      }
      total
    }
  }
`;

// ── Dashboard: current user's comments ───────────────────────────
export const GET_MY_COMMENTS = gql`
  ${COMMENT_WITH_CONTEXT_FIELDS}
  query GetMyComments($limit: Int, $offset: Int) {
    myComments(limit: $limit, offset: $offset) {
      items {
        ...CommentWithContextFields
      }
      total
    }
  }
`;

// ── Admin: all comments ───────────────────────────────────────────
export const GET_ALL_COMMENTS = gql`
  ${COMMENT_WITH_CONTEXT_FIELDS}
  query GetAllComments($limit: Int, $offset: Int) {
    allComments(limit: $limit, offset: $offset) {
      items {
        ...CommentWithContextFields
      }
      total
    }
  }
`;

// ── Mutations ─────────────────────────────────────────────────────
export const CREATE_COMMENT = gql`
  ${COMMENT_FIELDS}
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      ...CommentFields
    }
  }
`;

export const UPDATE_COMMENT = gql`
  ${COMMENT_FIELDS}
  mutation UpdateComment($id: String!, $body: String!) {
    updateComment(id: $id, body: $body) {
      ...CommentFields
    }
  }
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`;