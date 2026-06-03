// apps/web/src/tests/unit/components/ArticleStatusBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleStatusBadge } from '../../../components/ui/article-status-badge.js';

describe('ArticleStatusBadge', () => {
  it('renders "published" status', () => {
    render(<ArticleStatusBadge status="published" />);
    expect(screen.getByText(/published/i)).toBeDefined();
  });

  it('renders "draft" status', () => {
    render(<ArticleStatusBadge status="draft" />);
    expect(screen.getByText(/draft/i)).toBeDefined();
  });
});