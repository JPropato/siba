interface UnderConstructionPageProps {
  title: string;
  section?: string;
}

export function UnderConstructionPage({ title, section }: UnderConstructionPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-12 text-center">
      <div className="size-24 bg-brand/10 rounded-full flex items-center justify-center mb-8 border border-brand/20">
        <span className="material-symbols-outlined text-brand text-6xl">construction</span>
      </div>
      <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3 tracking-tight">{title}</h2>
      {section && (
        <p className="text-[var(--muted)] text-sm uppercase tracking-widest mb-6">{section}</p>
      )}
      <p className="text-[var(--muted)] text-base max-w-md leading-relaxed">
        Esta sección está en desarrollo. Pronto podrás acceder a todas las funcionalidades.
      </p>
      <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
        <span className="material-symbols-outlined text-lg">schedule</span>
        <span>Próximamente disponible</span>
      </div>
    </div>
  );
}

export default UnderConstructionPage;
