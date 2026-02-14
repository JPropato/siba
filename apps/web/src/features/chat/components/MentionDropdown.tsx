import { User, ClipboardList, HardHat, Building2, Truck, Package } from 'lucide-react';
import type { MentionResult } from '../hooks/useSearchMentions';

interface MentionDropdownProps {
  results: { users: MentionResult[]; entities: MentionResult[] };
  isSearching: boolean;
  mentionType: '@' | '#';
  onSelect: (result: MentionResult) => void;
  selectedIndex: number;
  position: { top: number; left: number };
}

const TYPE_ICONS = {
  user: User,
  ticket: ClipboardList,
  obra: HardHat,
  cliente: Building2,
  vehiculo: Truck,
  material: Package,
};

const TYPE_LABELS = {
  ticket: 'Tickets',
  obra: 'Obras',
  cliente: 'Clientes',
  vehiculo: 'Vehiculos',
  material: 'Materiales',
};

export function MentionDropdown({
  results,
  isSearching,
  mentionType,
  onSelect,
  selectedIndex,
  position,
}: MentionDropdownProps) {
  const allResults: MentionResult[] = [];
  let sections: { label: string; items: MentionResult[] }[] = [];

  if (mentionType === '@') {
    allResults.push(...results.users);
    if (results.users.length > 0) {
      sections = [{ label: 'Usuarios', items: results.users }];
    }
  } else {
    // Group entities by type
    const grouped = results.entities.reduce(
      (acc, entity) => {
        if (!acc[entity.type]) acc[entity.type] = [];
        acc[entity.type].push(entity);
        return acc;
      },
      {} as Record<string, MentionResult[]>
    );

    sections = Object.entries(grouped).map(([type, items]) => ({
      label: TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type,
      items,
    }));

    sections.forEach((s) => allResults.push(...s.items));
  }

  if (isSearching) {
    return (
      <div
        className="absolute bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg px-3 py-2 z-50"
        style={{ bottom: position.top, left: position.left }}
      >
        <p className="text-xs text-[var(--muted)]">Buscando...</p>
      </div>
    );
  }

  if (allResults.length === 0) {
    return null;
  }

  let globalIndex = 0;

  return (
    <div
      className="absolute bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 custom-scrollbar"
      style={{ bottom: position.top, left: position.left }}
    >
      {sections.map((section) => (
        <div key={section.label}>
          {sections.length > 1 && (
            <div className="px-3 py-1.5 border-b border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--muted)]">{section.label}</p>
            </div>
          )}
          {section.items.map((item) => {
            const currentIndex = globalIndex++;
            const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] || User;
            const isSelected = currentIndex === selectedIndex;

            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => onSelect(item)}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-[var(--background)] transition-colors ${
                  isSelected ? 'bg-[var(--background)]' : ''
                }`}
              >
                <Icon className="size-4 shrink-0 mt-0.5 text-[var(--muted)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {item.display}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">{item.detail}</p>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
