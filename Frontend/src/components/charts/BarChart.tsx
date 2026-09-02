import type { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { baseCartesianOptions, cartesianScales, chartColors } from './chartTheme';

export interface BarSeries {
  label: string;
  values: number[];
  color?: string;
}

interface BarChartProps {
  labels: string[];
  series: BarSeries[];
  height?: number;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  valueSuffix?: string;
  yMax?: number;
  valueFormatter?: (value: number) => string;
  /** Per-bar colours for single-series charts (e.g. stock by category). */
  pointColors?: string[];
  ariaLabel: string;
}

/**
 * Responsive Chart.js bar chart. Used for comparisons — utilisation by
 * category, stock levels, delay days, cost breakdowns.
 */
export function BarChart({
  labels,
  series,
  height = 260,
  showLegend = false,
  horizontal = false,
  stacked = false,
  valueSuffix = '',
  yMax,
  valueFormatter,
  pointColors,
  ariaLabel,
}: BarChartProps) {
  const data: ChartData<'bar'> = {
    labels,
    datasets: series.map((entry) => ({
      label: entry.label,
      data: entry.values,
      backgroundColor: pointColors ?? entry.color ?? chartColors.accent,
      hoverBackgroundColor: pointColors ?? entry.color ?? chartColors.accent,
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.68,
      categoryPercentage: 0.72,
    })),
  };

  const scales = cartesianScales({
    yMax,
    ySuffix: valueSuffix,
    yTickCallback: valueFormatter,
  });

  const options: ChartOptions<'bar'> = {
    ...(baseCartesianOptions as ChartOptions<'bar'>),
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
      },
      tooltip: {
        callbacks: {
          label(context) {
            const raw = Number(horizontal ? context.parsed.x : context.parsed.y);
            const formatted = valueFormatter
              ? valueFormatter(raw)
              : `${raw}${valueSuffix}`;
            return `${context.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: horizontal
      ? { x: { ...scales.y, stacked }, y: { ...scales.x, stacked } }
      : { x: { ...scales.x, stacked }, y: { ...scales.y, stacked } },
  };

  return (
    <div className="bt-chart-box" style={{ height }}>
      <Bar data={data} options={options} aria-label={ariaLabel} role="img" />
    </div>
  );
}
