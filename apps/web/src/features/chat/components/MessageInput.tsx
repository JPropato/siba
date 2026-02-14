import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { useSearchMentions } from '../hooks/useSearchMentions';
import { MentionDropdown } from './MentionDropdown';

interface MessageInputProps {
  onSend: (
    contenido: string,
    menciones: { entidadTipo: string; entidadId: number; textoDisplay: string }[]
  ) => void;
  disabled?: boolean;
}

interface MentionMode {
  type: '@' | '#';
  startPos: number;
  query: string;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [mentionMode, setMentionMode] = useState<MentionMode | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingMentions, setPendingMentions] = useState<
    { entidadTipo: string; entidadId: number; textoDisplay: string }[]
  >([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { results, isSearching, search, clear } = useSearchMentions();

  // Detect mention triggers
  const detectMention = (text: string, cursorPos: number): MentionMode | null => {
    // Look backwards from cursor for @ or #
    let i = cursorPos - 1;
    while (i >= 0) {
      const char = text[i];
      if (char === ' ' || char === '\n') {
        // Found space before trigger
        return null;
      }
      if (char === '@' || char === '#') {
        // Check if preceded by space/newline or at start
        const prevChar = i > 0 ? text[i - 1] : ' ';
        if (prevChar === ' ' || prevChar === '\n' || i === 0) {
          const query = text.slice(i + 1, cursorPos);
          return { type: char, startPos: i, query };
        }
      }
      i--;
    }
    return null;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    const cursorPos = e.target.selectionStart;
    const detected = detectMention(newValue, cursorPos);

    if (detected) {
      setMentionMode(detected);
      setSelectedIndex(0);
      search(detected.query, detected.type);
    } else {
      setMentionMode(null);
      clear();
    }
  };

  // Handle mention selection
  const handleMentionSelect = (result: {
    id: number;
    type: string;
    display: string;
    mentionText: string;
  }) => {
    if (!mentionMode || !textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const before = input.slice(0, mentionMode.startPos);
    const after = input.slice(cursorPos);
    const newText = before + result.mentionText + ' ' + after;

    setInput(newText);

    // Add to pending mentions
    const entidadTipo = result.type.charAt(0).toUpperCase() + result.type.slice(1);
    setPendingMentions((prev) => [
      ...prev,
      { entidadTipo, entidadId: result.id, textoDisplay: result.display },
    ]);

    // Clear mention mode
    setMentionMode(null);
    clear();

    // Focus and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = before.length + result.mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionMode) {
      const allResults = mentionMode.type === '@' ? results.users : results.entities;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleMentionSelect(allResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMentionMode(null);
        clear();
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, pendingMentions);
    setInput('');
    setPendingMentions([]);
  };

  // Calculate dropdown position
  const getDropdownPosition = (): { top: number; left: number } => {
    return {
      top: 8, // Position above textarea
      left: 0,
    };
  };

  const allResults = mentionMode?.type === '@' ? results.users : results.entities;
  const showDropdown = mentionMode && (allResults.length > 0 || isSearching);

  return (
    <div className="shrink-0 border-t border-[var(--border)] px-3 py-2">
      <div className="relative">
        {showDropdown && (
          <MentionDropdown
            results={results}
            isSearching={isSearching}
            mentionType={mentionMode.type}
            onSelect={handleMentionSelect}
            selectedIndex={selectedIndex}
            position={getDropdownPosition()}
          />
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (@ para mencionar, # para entidades)"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-brand/50 max-h-24"
            disabled={disabled}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="p-2 rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
