import { gql } from 'graphql-request';

export const GET_COMMENTS = gql`
  query GetComments($articleId: String!, $limit: Int, $offset: Int) {
    comments(articleId: $articleId, limit: $limit, offset: $offset) {
      items {
        id
        body
        createdAt
        updatedAt
        author {
          id
          name
          avatar
        }
      }
      total
    }
  }
`;

export const GET_MY_COMMENTS = gql`
  query GetMyComments {
    myComments {
      id
      body
      articleId
      createdAt
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      body
      createdAt
      author {
        id
        name
        avatar
      }
    }
  }
`;

export const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: String!, $body: String!) {
    updateComment(id: $id, body: $body) {
      id
      body
      updatedAt
    }
  }
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`;