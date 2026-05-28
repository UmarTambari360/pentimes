import { gql } from 'graphql-request';

export const GET_SCHEDULED_PROGRAMS = gql`
  query GetScheduledPrograms($status: String) {
    scheduledPrograms(status: $status) {
      id
      title
      description
      scheduledAt
      durationMinutes
      status
      createdAt
    }
  }
`;

export const GET_UPCOMING_PROGRAMS = gql`
  query GetUpcomingPrograms($limit: Int) {
    upcomingPrograms(limit: $limit) {
      id
      title
      description
      scheduledAt
      durationMinutes
      status
    }
  }
`;

export const CREATE_PROGRAM = gql`
  mutation CreateScheduledProgram($input: CreateProgramInput!) {
    createScheduledProgram(input: $input) {
      id
      title
      status
    }
  }
`;

export const UPDATE_PROGRAM = gql`
  mutation UpdateScheduledProgram($id: String!, $input: UpdateProgramInput!) {
    updateScheduledProgram(id: $id, input: $input) {
      id
      title
      status
    }
  }
`;

export const DELETE_PROGRAM = gql`
  mutation DeleteScheduledProgram($id: String!) {
    deleteScheduledProgram(id: $id)
  }
`;