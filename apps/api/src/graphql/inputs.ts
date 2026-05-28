import { builder } from './builder.js';

export const RegisterInput = builder.inputType('RegisterInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    email: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
});

export const LoginInput = builder.inputType('LoginInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
});

export const UpdateProfileInput = builder.inputType('UpdateProfileInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    bio: t.string({ required: false }),
    avatar: t.string({ required: false }),
  }),
});

export const ChangePasswordInput = builder.inputType('ChangePasswordInput', {
  fields: (t) => ({
    currentPassword: t.string({ required: true }),
    newPassword: t.string({ required: true }),
    confirmPassword: t.string({ required: true }),
  }),
});

export const UpdateUserRoleInput = builder.inputType('UpdateUserRoleInput', {
  fields: (t) => ({
    userId: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
});

export const CreateArticleInput = builder.inputType('CreateArticleInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    excerpt: t.string({ required: false }),
    content: t.string({ required: true }),
    coverImage: t.string({ required: false }),
    status: t.string({ required: false, defaultValue: 'draft' }),
    categoryIds: t.stringList({ required: true }),
    slug: t.string({ required: false }),
  }),
});

export const UpdateArticleInput = builder.inputType('UpdateArticleInput', {
  fields: (t) => ({
    title: t.string({ required: false }),
    excerpt: t.string({ required: false }),
    content: t.string({ required: false }),
    coverImage: t.string({ required: false }),
    status: t.string({ required: false }),
    categoryIds: t.stringList({ required: false }),
    slug: t.string({ required: false }),
  }),
});

export const ArticleFiltersInput = builder.inputType('ArticleFiltersInput', {
  fields: (t) => ({
    status: t.string({ required: false }),
    categorySlug: t.string({ required: false }),
    authorId: t.string({ required: false }),
    limit: t.int({ required: false, defaultValue: 12 }),
    offset: t.int({ required: false, defaultValue: 0 }),
  }),
});

export const CreateCategoryInput = builder.inputType('CreateCategoryInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    slug: t.string({ required: false }),
  }),
});

export const UpdateCategoryInput = builder.inputType('UpdateCategoryInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    slug: t.string({ required: false }),
  }),
});

export const CreateCommentInput = builder.inputType('CreateCommentInput', {
  fields: (t) => ({
    articleId: t.string({ required: true }),
    body: t.string({ required: true }),
  }),
});

export const CreateProgramInput = builder.inputType('CreateProgramInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string({ required: false }),
    scheduledAt: t.string({ required: true }),
    durationMinutes: t.int({ required: false }),
    status: t.string({ required: false, defaultValue: 'upcoming' }),
  }),
});

export const UpdateProgramInput = builder.inputType('UpdateProgramInput', {
  fields: (t) => ({
    title: t.string({ required: false }),
    description: t.string({ required: false }),
    scheduledAt: t.string({ required: false }),
    durationMinutes: t.int({ required: false }),
    status: t.string({ required: false }),
  }),
});