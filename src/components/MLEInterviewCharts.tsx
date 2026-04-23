import React from 'react';

type WeightItem = {
  label: string;
  value: number;
};

type TrendSeries = {
  label: string;
  color: string;
  values: number[];
};

const roundWeights: WeightItem[] = [
  {label: 'Coding', value: 20},
  {label: 'ML fundamentals', value: 15},
  {label: 'ML system design', value: 30},
  {label: 'Behavioral', value: 20},
  {label: 'Project deep-dive', value: 15},
];

const weekLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
const trendSeries: TrendSeries[] = [
  {label: 'Coding readiness', color: '#0284c7', values: [25, 35, 52, 63, 70, 76, 84, 90]},
  {label: 'MLSD readiness', color: '#16a34a', values: [12, 18, 26, 38, 52, 64, 78, 89]},
  {label: 'Behavioral clarity', color: '#d97706', values: [20, 26, 34, 42, 50, 62, 75, 88]},
];

function toPoints(values: number[]): string {
  const xStep = 100 / (values.length - 1);
  return values
    .map((value, idx) => {
      const x = idx * xStep;
      const y = 100 - value;
      return `${x},${y}`;
    })
    .join(' ');
}

export default function MLEInterviewCharts(): React.JSX.Element {
  return (
    <div className="not-prose my-8 grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Round weight by offer impact</h3>
        <div className="space-y-3">
          {roundWeights.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{width: `${item.value}%`}}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">8-week readiness trend</h3>
        <svg viewBox="0 0 100 100" className="h-56 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/40">
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line x1="0" y1={100 - tick} x2="100" y2={100 - tick} stroke="currentColor" opacity="0.2" strokeWidth="0.4" />
            </g>
          ))}
          {trendSeries.map((series) => (
            <polyline
              key={series.label}
              fill="none"
              stroke={series.color}
              strokeWidth="1.8"
              points={toPoints(series.values)}
            />
          ))}
        </svg>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {trendSeries.map((series) => (
            <span key={series.label} className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{backgroundColor: series.color}} />
              {series.label}
            </span>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          {weekLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
