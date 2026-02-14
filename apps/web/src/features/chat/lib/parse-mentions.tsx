import React from 'react';
import { useNavigate } from 'react-router-dom';

// Regex para detectar menciones: @[display](type:id) y #[display](type:id)
const MENTION_REGEX = /[@#]\[([^\]]+)\]\((\w+):(\d+)\)/g;

interface MentionBadgeProps {
  display: string;
  type: string;
  id: number;
  isUser: boolean;
}

// Routes for entity types
function getEntityRoute(type: string, id: number): string | null {
  switch (type) {
    case 'user':
      return null; // Users don't have a detail page
    case 'ticket':
      return `/dashboard/tickets/${id}`;
    case 'obra':
      return '/dashboard/obras'; // Obras don't have :id route yet
    case 'cliente':
      return '/dashboard/clients';
    case 'vehiculo':
      return '/dashboard/vehicles';
    case 'material':
      return '/dashboard/materials';
    default:
      return null;
  }
}

function MentionBadge({ display, type, id, isUser }: MentionBadgeProps) {
  const navigate = useNavigate();
  const route = getEntityRoute(type, id);
  const prefix = isUser ? '@' : '#';

  const handleClick = () => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <span
      className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
        route ? 'cursor-pointer' : ''
      } ${
        isUser
          ? 'bg-brand/15 text-brand hover:bg-brand/25'
          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25'
      } transition-colors`}
      onClick={route ? handleClick : undefined}
      title={`${prefix}${display}`}
    >
      {prefix}
      {display}
    </span>
  );
}

export function parseMentions(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Use matchAll to find all mentions
  const matches = content.matchAll(MENTION_REGEX);

  for (const match of matches) {
    const fullMatch = match[0];
    const display = match[1];
    const type = match[2];
    const id = parseInt(match[3], 10);
    const startIdx = match.index!;
    const isUser = fullMatch.startsWith('@');

    // Text before this mention
    if (startIdx > lastIndex) {
      parts.push(content.substring(lastIndex, startIdx));
    }

    // The mention badge
    parts.push(
      <MentionBadge
        key={`mention-${startIdx}`}
        display={display}
        type={type}
        id={id}
        isUser={isUser}
      />
    );

    lastIndex = startIdx + fullMatch.length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}
