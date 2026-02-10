import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RUBRO_LABELS } from '../../types/tickets';

interface Props {
  data: Array<{ rubro: string; count: number }>;
}

export const RubroChart = memo(function RubroChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: RUBRO_LABELS[d.rubro as keyof typeof RUBRO_LABELS] || d.rubro,
    value: d.count,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        Tickets por Rubro
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 0, right: 10, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={35}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value, 'Tickets']}
            />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              style={{ cursor: 'default' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
