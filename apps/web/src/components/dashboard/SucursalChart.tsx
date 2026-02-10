import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ sucursalId: number; nombre: string; count: number }>;
}

export const SucursalChart = memo(function SucursalChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.nombre.length > 25 ? d.nombre.slice(0, 23) + '...' : d.nombre,
    fullName: d.nombre,
    value: d.count,
  }));

  // Dynamic height: min 200px, 28px per bar
  const chartHeight = Math.max(200, chartData.length * 28 + 40);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Tickets por Sucursal
        </h3>
        <span className="text-[10px] text-slate-400">Top {chartData.length}</span>
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Sin datos de sucursales</p>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
            >
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
                width={150}
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
                labelFormatter={(_label, payload) =>
                  (payload as Array<{ payload?: { fullName?: string } }>)?.[0]?.payload?.fullName ||
                  String(_label)
                }
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                style={{ cursor: 'default' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
