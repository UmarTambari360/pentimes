"use client";

import { MessageSquare } from "lucide-react";

export function CommentsModeration() {
  return (
    <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-serif font-semibold text-body mb-2">
        Comment Moderation
      </h3>
      <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
        To moderate comments, visit individual article pages. Comment deletion
        is available inline on each article&apos;s comments section when logged
        in as admin.
      </p>
    </div>
  );
}
