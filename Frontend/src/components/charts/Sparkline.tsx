import type { ChartData, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { chartColors } from './chartTheme';

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  ariaLabel: string;
}

/**
 * Axis-free micro trend line for stat cards — matches the small green
 * sparkline on the Figma "Site Progress" card.
 */
export function Sparkline({
  values,
  color = chartColors.green,
  height = 36,
  ariaLabel,
}: SparklineProps) {
  const data: ChartData<'line'> = {
    labels: values.map((_, index) => String(index)),
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: `${color}1f`,
        borderWidth: 2,
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: false },
    },
    elements: { line: { capBezierPoints: true } },
  };

  return (
    <div className="bt-chart-box" style={{ height }}>
      <Line data={data} options={options} aria-label={ariaLabel} role="img" />
    </div>
  );
}
