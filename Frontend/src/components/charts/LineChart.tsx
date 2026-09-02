import type { ChartData, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { baseCartesianOptions, cartesianScales, chartColors } from './chartTheme';

export interface LineSeries {
  label: string;
  values: number[];
  color?: string;
  /** Dashed stroke — used for the "Planned" reference series. */
  dashed?: boolean;
  /** Soft area fill beneath the line. */
  filled?: boolean;
}

interface LineChartProps {
  labels: string[];
  series: LineSeries[];
  height?: number;
  showLegend?: boolean;
  /** Appended to axis ticks and tooltip values, e.g. "%". */
  valueSuffix?: string;
  yMax?: number;
  /** Formats tooltip values; falls back to `value + valueSuffix`. */
  valueFormatter?: (value: number) => string;
  ariaLabel: string;
}

/**
 * Responsive Chart.js line chart. Used for progress trends, attendance
 * trends and planned-vs-actual portfolio performance.
 */
export function LineChart({
  labels,
  series,
  height = 260,
  showLegend = true,
  valueSuffix = '',
  yMax,
  valueFormatter,
  ariaLabel,
}: LineChartProps) {
  const data: ChartData<'line'> = {
    labels,
    datasets: series.map((entry) => {
      const color = entry.color ?? chartColors.accent;

      return {
        label: entry.label,
        data: entry.values,
        borderColor: color,
        backgroundColor: entry.filled ? `${color}22` : color,
        borderWidth: 2.5,
        borderDash: entry.dashed ? [6, 5] : undefined,
        fill: entry.filled ?? false,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        pointBorderColor: '#0d0d0d',
        pointBorderWidth: 2,
        pointHitRadius: 16,
      };
    }),
  };

  const options: ChartOptions<'line'> = {
    ...(baseCartesianOptions as ChartOptions<'line'>),
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
      },
      tooltip: {
        callbacks: {
          label(context) {
            const raw = Number(context.parsed.y);
            const formatted = valueFormatter
              ? valueFormatter(raw)
              : `${raw}${valueSuffix}`;
            return `${context.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: cartesianScales({ yMax, ySuffix: valueSuffix }),
  };

  return (
    <div className="bt-chart-box" style={{ height }}>
      <Line data={data} options={options} aria-label={ariaLabel} role="img" />
    </div>
  );
}
