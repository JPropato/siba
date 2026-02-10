import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TIPO_TICKET_LABELS } from '../../types/tickets';

interface Props {
  data: Array<{ tipoTicket: string; count: number }>;
}

const TIPO_HEX: Record<string, string> = {
  SEA: '#ef4444',
  SEP: '#f97316',
  SN: '#64748b',
};

const TIPO_LABELS_SHORT: Record<string, string> = {
  SEA: 'Emerg. Alta',
  SEP: 'Emerg. Prog.',
  SN: 'Normal',
};

export const TipoSLAChart = memo(function TipoSLAChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: TIPO_TICKET_LABELS[d.tipoTicket as keyof typeof TIPO_TICKET_LABELS] || d.tipoTicket,
    shortName: TIPO_LABELS_SHORT[d.tipoTicket] || d.tipoTicket,
    value: d.count,
    key: d.tipoTicket,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        Tickets por Tipo SLA
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              style={{ cursor: 'default' }}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={TIPO_HEX[entry.key] || '#64748b'}
                  style={{ cursor: 'default' }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                name,
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
