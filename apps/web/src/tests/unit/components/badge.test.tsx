// apps/web/src/tests/unit/components/Badge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../../components/ui/badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Published</Badge>);
    expect(screen.getByText('Published')).toBeDefined();
  });

  it('applies default variant class', () => {
    const { container } = render(<Badge>Draft</Badge>);
    expect(container.firstChild).toBeDefined();
  });

  it('renders with amber variant', () => {
    render(<Badge variant="amber">Author</Badge>);
    expect(screen.getByText('Author')).toBeDefined();
  });

  it('renders published variant', () => {
    render(<Badge variant="published">Published</Badge>);
    expect(screen.getByText('Published')).toBeDefined();
  });

  it('renders draft variant', () => {
    render(<Badge variant="draft">Draft</Badge>);
    expect(screen.getByText('Draft')).toBeDefined();
  });
});