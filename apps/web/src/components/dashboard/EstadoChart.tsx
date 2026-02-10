import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ESTADO_LABELS } from '../../types/tickets';

interface Props {
  data: Array<{ estado: string; count: number }>;
}

const ESTADO_HEX: Record<string, string> = {
  NUEVO: '#64748b',
  ASIGNADO: '#3b82f6',
  EN_CURSO: '#f59e0b',
  PENDIENTE_CLIENTE: '#a855f7',
  FINALIZADO: '#22c55e',
  CANCELADO: '#94a3b8',
};

export const EstadoChart = memo(function EstadoChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: ESTADO_LABELS[d.estado as keyof typeof ESTADO_LABELS] || d.estado,
    value: d.count,
    key: d.estado,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        Tickets por Estado
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [value ?? 0, 'Tickets']}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              style={{ cursor: 'default' }}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={ESTADO_HEX[entry.key] || '#64748b'}
                  style={{ cursor: 'default' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
