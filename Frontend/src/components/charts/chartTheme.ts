import type { ChartOptions } from 'chart.js';

/** Palette lifted from the Figma: peach primary, signal green secondary. */
export const chartColors = {
  accent: '#f8b98e',
  accentSoft: 'rgba(248, 185, 142, 0.16)',
  green: '#22c55e',
  greenSoft: 'rgba(34, 197, 94, 0.16)',
  amber: '#f5a524',
  red: '#ef4444',
  blue: '#60a5fa',
  violet: '#a78bfa',
  grid: 'rgba(255, 255, 255, 0.05)',
  track: '#232323',
  text: '#a1a1aa',
} as const;

/** Ordered series palette for multi-category charts (doughnut, stacked bar). */
export const categoricalPalette: string[] = [
  chartColors.accent,
  chartColors.green,
  chartColors.blue,
  chartColors.amber,
  chartColors.violet,
  chartColors.red,
  '#5eead4',
];

/**
 * Axis defaults shared by the line and bar charts. Returned loosely typed
 * (`ChartOptions['scales']`) because Chart.js's discriminated scale union is
 * needlessly strict for a shared, spread-into-options helper.
 */
export function cartesianScales(options: {
  yMax?: number;
  ySuffix?: string;
  showGridX?: boolean;
  yTickCallback?: (value: number) => string;
}): NonNullable<ChartOptions<'line' | 'bar'>['scales']> {
  const { yMax, ySuffix = '', showGridX = false, yTickCallback } = options;

  return {
    x: {
      grid: {
        display: showGridX,
        color: chartColors.grid,
      },
      border: { display: false },
      ticks: {
        color: chartColors.text,
        maxRotation: 0,
        autoSkipPadding: 12,
      },
    },
    y: {
      beginAtZero: true,
      max: yMax,
      grid: { color: chartColors.grid },
      border: { display: false },
      ticks: {
        color: chartColors.text,
        padding: 8,
        callback(tickValue: string | number) {
          const numeric = Number(tickValue);
          if (yTickCallback) return yTickCallback(numeric);
          return `${numeric}${ySuffix}`;
        },
      },
    },
  };
}

/** Base options every cartesian chart starts from. */
export const baseCartesianOptions: ChartOptions<'line' | 'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  layout: {
    padding: { top: 4 },
  },
};
