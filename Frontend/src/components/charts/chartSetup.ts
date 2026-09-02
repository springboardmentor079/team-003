import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';

/**
 * Chart.js registration and global defaults.
 *
 * Imported once from `main.tsx` so every chart in the app inherits the same
 * dark theme, typography and tooltip styling.
 */
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
);

ChartJS.defaults.font.family =
  '"Inter", "Segoe UI", system-ui, sans-serif';
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = '#7c7c85';
ChartJS.defaults.borderColor = '#2a2a2a';
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.responsive = true;

ChartJS.defaults.plugins.tooltip.backgroundColor = '#1c1c1c';
ChartJS.defaults.plugins.tooltip.borderColor = '#3a3a3a';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.titleColor = '#f4f4f5';
ChartJS.defaults.plugins.tooltip.bodyColor = '#a1a1aa';
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.displayColors = true;
ChartJS.defaults.plugins.tooltip.boxPadding = 4;

ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = 'circle';
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
ChartJS.defaults.plugins.legend.labels.boxHeight = 8;
ChartJS.defaults.plugins.legend.labels.padding = 16;
ChartJS.defaults.plugins.legend.labels.color = '#a1a1aa';

export { ChartJS };
