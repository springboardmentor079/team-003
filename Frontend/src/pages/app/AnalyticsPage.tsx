import { Link } from 'react-router-dom';

import { BarChart } from '../../components/charts/BarChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { LineChart } from '../../components/charts/LineChart';
import { categoricalPalette, chartColors } from '../../components/charts/chartTheme';
import { PageHeader } from '../../components/common/PageHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ChartCard, LegendChip } from '../../components/dashboard/ChartCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { analyticsKpis, portfolioPerformance } from '../../data/analytics';
import {
  costByCategory,
  totalBudgetAllocated,
  totalBudgetRemaining,
  totalBudgetSpent,
} from '../../data/budget';
import { procurementByCategory } from '../../data/procurement';
import { projects } from '../../data/projects';
import { resourceUtilisation } from '../../data/resources';
import { totalWorkforce, workforceDistribution } from '../../data/workforce';
import { formatCurrencyCompact, formatNumber } from '../../utils/format';

const budgetUtilisation = Math.round((totalBudgetSpent / totalBudgetAllocated) * 100);

/**
 * Analytics dashboard, rebuilt from the Figma "analatics" frame.
 *
 * Corrections against the document:
 *  - The four KPI cards were empty grey placeholders in the Figma; they now
 *    carry the Project Manager dashboard metrics (module 9).
 *  - "Workforce Profile" listed only Contractors, Engineers and Supervisors;
 *    all six document workforce categories are restored and the totals
 *    recomputed.
 *  - Charts for cost by category (module 11), procurement spend (module 7)
 *    and resource utilisation (module 4) are added — all three are listed in
 *    the document's dashboard requirements but missing from the Figma.
 */
export function AnalyticsPage() {
  const activeSites = projects.filter(
    (project) => project.status === 'In Progress' || project.status === 'Delayed',
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Executive oversight and site performance intelligence across the portfolio."
        actions={
          <Link to="/app/reports" className="btn btn-outline-bt">
            <i className="bi bi-file-earmark-arrow-down me-2" aria-hidden="true" />
            Export reports
          </Link>
        }
      />

      {/* KPI strip */}
      <div className="row g-3 g-lg-4 mb-4">
        {analyticsKpis.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3" key={metric.id}>
            <StatCard metric={metric} />
          </div>
        ))}
      </div>

      {/* Performance + budget */}
      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Project Performance"
            subtitle="Planned vs actual across portfolio"
            actions={
              <>
                <LegendChip label="Actual" color={chartColors.accent} />
                <LegendChip label="Planned" color={chartColors.green} />
              </>
            }
          >
            <LineChart
              labels={portfolioPerformance.labels}
              series={[
                {
                  label: 'Actual',
                  values: portfolioPerformance.actual,
                  color: chartColors.accent,
                  filled: true,
                },
                {
                  label: 'Planned',
                  values: portfolioPerformance.planned,
                  color: chartColors.green,
                  dashed: true,
                },
              ]}
              valueSuffix="%"
              yMax={100}
              showLegend={false}
              height={320}
              ariaLabel="Planned versus actual portfolio progress by quarter"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Budget Allocation"
            subtitle="Spent vs remaining"
            footer={
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li className="d-flex justify-content-between align-items-center">
                  <span className="d-inline-flex align-items-center gap-2">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: chartColors.accent,
                      }}
                      aria-hidden="true"
                    />
                    <span className="small">Spent</span>
                  </span>
                  <span className="bt-mono small">
                    {formatCurrencyCompact(totalBudgetSpent)}
                  </span>
                </li>
                <li className="d-flex justify-content-between align-items-center">
                  <span className="d-inline-flex align-items-center gap-2">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: chartColors.track,
                      }}
                      aria-hidden="true"
                    />
                    <span className="small">Remaining</span>
                  </span>
                  <span className="bt-mono small">
                    {formatCurrencyCompact(totalBudgetRemaining)}
                  </span>
                </li>
              </ul>
            }
          >
            <DoughnutChart
              labels={['Spent', 'Remaining']}
              values={[totalBudgetSpent, totalBudgetRemaining]}
              colors={[chartColors.accent, chartColors.track]}
              centerValue={`${budgetUtilisation}%`}
              centerCaption="Utilised"
              height={250}
              valueFormatter={formatCurrencyCompact}
              ariaLabel="Portfolio budget spent versus remaining"
            />
          </ChartCard>
        </div>
      </div>

      {/* Site health + workforce */}
      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Active Sites Health"
            subtitle="Schedule health and completion by project"
            actions={
              <Link to="/app/projects" className="bt-label bt-label-accent mb-0">
                View all
              </Link>
            }
          >
            <div className="bt-table-wrap">
              <table className="bt-table">
                <caption className="visually-hidden">
                  Active project sites with schedule health and completion
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Project name</th>
                    <th scope="col">Status</th>
                    <th scope="col" style={{ width: '38%' }}>
                      Progress
                    </th>
                    <th scope="col" style={{ textAlign: 'end' }}>
                      Completion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeSites.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <Link to={`/app/projects/${project.code}`} className="fw-semibold">
                          {project.name}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={project.health} />
                      </td>
                      <td>
                        <ProgressBar
                          value={project.progress}
                          tone={
                            project.health === 'Delayed'
                              ? 'danger'
                              : project.health === 'At Risk'
                                ? 'warning'
                                : 'success'
                          }
                          label={`${project.name} completion`}
                        />
                      </td>
                      <td className="bt-mono" style={{ textAlign: 'end' }}>
                        {project.progress}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Workforce Profile"
            subtitle="Current deployment split"
            footer={
              <p className="bt-label mb-0 text-center">
                Total active workforce: {formatNumber(totalWorkforce)}
              </p>
            }
          >
            <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
              {workforceDistribution.map((entry, index) => (
                <li key={entry.category}>
                  <div className="d-flex justify-content-between align-items-baseline gap-2 mb-2">
                    <span className="small fw-semibold">{entry.category}</span>
                    <span className="bt-label mb-0">
                      {formatNumber(entry.headcount)} ({entry.percentage}%)
                    </span>
                  </div>

                  <ProgressBar
                    value={entry.percentage}
                    color={categoricalPalette[index % categoricalPalette.length]}
                    label={`${entry.category} share of workforce`}
                  />
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </div>

      {/* Cost, procurement, resources */}
      <div className="row g-3 g-lg-4">
        <div className="col-12 col-xl-4">
          <ChartCard title="Cost Distribution" subtitle="Portfolio spend by cost category">
            <DoughnutChart
              labels={costByCategory.map((entry) => entry.label)}
              values={costByCategory.map((entry) => entry.value)}
              height={260}
              showLegend
              cutout="62%"
              valueFormatter={formatCurrencyCompact}
              ariaLabel="Portfolio spend by cost category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Procurement Overview"
            subtitle="Order value by procurement category"
          >
            <BarChart
              labels={procurementByCategory.map((entry) => entry.label)}
              series={[
                {
                  label: 'Order value',
                  values: procurementByCategory.map((entry) => entry.value),
                  color: chartColors.accent,
                },
              ]}
              horizontal
              height={260}
              valueFormatter={formatCurrencyCompact}
              ariaLabel="Procurement order value by category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Resource Efficiency"
            subtitle="Utilisation by resource category"
          >
            <BarChart
              labels={resourceUtilisation.map((entry) => entry.label)}
              series={[
                {
                  label: 'Utilisation',
                  values: resourceUtilisation.map((entry) => entry.value),
                  color: chartColors.green,
                },
              ]}
              horizontal
              valueSuffix="%"
              yMax={100}
              height={260}
              ariaLabel="Resource utilisation by category"
            />
          </ChartCard>
        </div>
      </div>
    </>
  );
}
