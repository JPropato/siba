import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Command,
} from 'cmdk';
import {
    Users,
    Briefcase,
    MapPin,
    ClipboardList,
    HardHat,
    LayoutDashboard,
    Search
} from 'lucide-react';

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <div className="flex items-center border-b px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input
                    placeholder="Escribe un comando o busca..."
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900">
                <Command.Empty>No se encontraron resultados.</Command.Empty>
                <Command.Group heading="Módulos Principales" className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <LayoutDashboard className="h-4 w-4 text-brand" />
                        <span>Dashboard</span>
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(() => navigate('/dashboard/tickets'))} className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ClipboardList className="h-4 w-4 text-brand" />
                        <span>Tickets</span>
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(() => navigate('/dashboard/obras'))} className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <HardHat className="h-4 w-4 text-brand" />
                        <span>Obras</span>
                    </Command.Item>
                </Command.Group>
                <Command.Separator className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                <Command.Group heading="Administración" className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Command.Item onSelect={() => runCommand(() => navigate('/dashboard/users'))} className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Users className="h-4 w-4" />
                        <span>Usuarios</span>
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(() => navigate('/dashboard/clients'))} className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Briefcase className="h-4 w-4" />
                        <span>Clientes</span>
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(() => navigate('/dashboard/sedes'))} className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <MapPin className="h-4 w-4" />
                        <span>Sedes</span>
                    </Command.Item>
                </Command.Group>
            </Command.List>
        </CommandDialog>
    );
}

function CommandDialog({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => onOpenChange(false)}>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                <Command onKeyDown={(e) => { if (e.key === 'Escape') onOpenChange(false); }}>
                    {children}
                </Command>
            </div>
        </div>
    );
}
