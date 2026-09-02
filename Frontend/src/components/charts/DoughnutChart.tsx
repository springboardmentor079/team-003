import type { ChartData, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import { categoricalPalette } from './chartTheme';

interface DoughnutChartProps {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
  /** Large figure rendered in the middle of the ring. */
  centerValue?: string;
  centerCaption?: string;
  showLegend?: boolean;
  cutout?: string;
  valueFormatter?: (value: number) => string;
  ariaLabel: string;
}

/**
 * Responsive Chart.js doughnut. Used for distributions — budget spent vs
 * remaining, workforce split, procurement spend by category.
 *
 * The centre figure is an HTML overlay rather than a canvas plugin so it
 * stays crisp at every device pixel ratio.
 */
export function DoughnutChart({
  labels,
  values,
  colors,
  height = 240,
  centerValue,
  centerCaption,
  showLegend = false,
  cutout = '72%',
  valueFormatter,
  ariaLabel,
}: DoughnutChartProps) {
  const palette = colors ?? categoricalPalette;
  const total = values.reduce((sum, value) => sum + value, 0);

  const data: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: palette,
        hoverBackgroundColor: palette,
        borderColor: '#161616',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label(context) {
            const raw = Number(context.parsed);
            const formatted = valueFormatter ? valueFormatter(raw) : String(raw);
            const share = total > 0 ? Math.round((raw / total) * 100) : 0;
            return `${context.label}: ${formatted} (${share}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bt-chart-box position-relative" style={{ height }}>
      <Doughnut data={data} options={options} aria-label={ariaLabel} role="img" />

      {centerValue && (
        <div
          className="position-absolute top-50 start-50 translate-middle text-center pe-none"
          aria-hidden="true"
        >
          <div className="bt-display" style={{ fontSize: '1.9rem', lineHeight: 1.1 }}>
            {centerValue}
          </div>
          {centerCaption && (
            <div className="bt-text-dim small mt-1">{centerCaption}</div>
          )}
        </div>
      )}
    </div>
  );
}
