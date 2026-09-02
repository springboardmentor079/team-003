import { Link, useParams } from 'react-router-dom';

import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { LineChart } from '../../components/charts/LineChart';
import { chartColors } from '../../components/charts/chartTheme';
import { PageHeader, StateMessage } from '../../components/common/PageHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { MilestoneTimeline } from '../../components/dashboard/MilestoneTimeline';
import { budgetLines } from '../../data/budget';
import { milestones, projects } from '../../data/projects';
import { activityLog, weeklyProgressTrend } from '../../data/siteProgress';
import { formatCurrency, formatCurrencyCompact, formatDate } from '../../utils/format';

/**
 * Project detail — document module 2 (update project, scheduling,
 * milestones, status tracking, closure) plus its budget breakdown.
 */
export function ProjectDetailPage() {
  const { code } = useParams<{ code: string }>();
  const project = projects.find((entry) => entry.code === code);

  if (!project) {
    return (
      <div className="bt-card bt-card-pad">
        <StateMessage
          icon="bi-search"
          title="Project not found"
          message={`No project is registered with the ID "${code}".`}
          action={
            <Link to="/app/projects" className="btn btn-accent">
              Back to projects
            </Link>
          }
        />
      </div>
    );
  }

  const projectMilestones = milestones.filter(
    (milestone) => milestone.projectId === project.id,
  );
  const projectActivity = activityLog.filter(
    (entry) => entry.projectId === project.id,
  );
  const projectBudget = budgetLines.filter(
    (line) => line.projectName === project.name,
  );

  const budgetRemaining = project.budgetAllocated - project.budgetSpent;
  const budgetUsedPercent = Math.round(
    (project.budgetSpent / project.budgetAllocated) * 100,
  );

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle={project.description}
        eyebrow={
          <>
            <Link to="/app/projects" className="bt-label bt-label-accent mb-0">
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              All projects
            </Link>
            <StatusBadge status={project.status} />
            <StatusBadge status={project.health} />
            <span className="bt-label mb-0">Project ID: {project.code}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-outline-bt">
              <i className="bi bi-pencil me-2" aria-hidden="true" />
              Update project
            </button>
            <button
              type="button"
              className="btn btn-accent"
              disabled={project.status === 'Closed'}
            >
              <i className="bi bi-check2-circle me-2" aria-hidden="true" />
              Close project
            </button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="row g-3 g-lg-4 mb-4">
        {[
          { label: 'Category', value: project.category, icon: 'bi-tag' },
          { label: 'Project manager', value: project.projectManager, icon: 'bi-person-gear' },
          { label: 'Site engineer', value: project.siteEngineer, icon: 'bi-person-vcard' },
          { label: 'Workforce on site', value: `${project.workforceCount}`, icon: 'bi-people' },
        ].map((item) => (
          <div className="col-12 col-sm-6 col-xl-3" key={item.label}>
            <div className="bt-card bt-card-pad d-flex align-items-center gap-3">
              <span className="bt-icon-tile bt-accent">
                <i className={`bi ${item.icon}`} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="bt-label mb-1">{item.label}</p>
                <p className="mb-0 fw-semibold text-truncate">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 g-lg-4 mb-4">
        {/* Schedule */}
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Progress trend"
            subtitle="Cumulative completion, last nine weeks"
            actions={
              <span className="bt-label mb-0">
                {formatDate(project.startDate)} — {formatDate(project.targetEndDate)}
              </span>
            }
          >
            <LineChart
              labels={weeklyProgressTrend.map((point) => point.label)}
              series={[
                {
                  label: 'Completion',
                  values: weeklyProgressTrend.map((point) => point.value),
                  color: chartColors.accent,
                  filled: true,
                },
              ]}
              valueSuffix="%"
              yMax={100}
              showLegend={false}
              height={280}
              ariaLabel={`Weekly completion trend for ${project.name}`}
            />
          </ChartCard>
        </div>

        {/* Budget */}
        <div className="col-12 col-xl-4">
          <ChartCard
            title="Budget utilisation"
            subtitle="Spent vs remaining"
            footer={
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li className="d-flex justify-content-between align-items-center">
                  <span className="bt-label mb-0 d-inline-flex align-items-center gap-2">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: chartColors.accent,
                      }}
                      aria-hidden="true"
                    />
                    Spent
                  </span>
                  <span className="bt-mono small">
                    {formatCurrencyCompact(project.budgetSpent)}
                  </span>
                </li>
                <li className="d-flex justify-content-between align-items-center">
                  <span className="bt-label mb-0 d-inline-flex align-items-center gap-2">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: chartColors.track,
                      }}
                      aria-hidden="true"
                    />
                    Remaining
                  </span>
                  <span className="bt-mono small">
                    {formatCurrencyCompact(budgetRemaining)}
                  </span>
                </li>
              </ul>
            }
          >
            <DoughnutChart
              labels={['Spent', 'Remaining']}
              values={[project.budgetSpent, budgetRemaining]}
              colors={[chartColors.accent, chartColors.track]}
              centerValue={`${budgetUsedPercent}%`}
              centerCaption="Utilised"
              height={210}
              valueFormatter={formatCurrencyCompact}
              ariaLabel={`Budget utilisation for ${project.name}`}
            />
          </ChartCard>
        </div>
      </div>

      <div className="row g-3 g-lg-4">
        <div className="col-12 col-xl-7">
          <ChartCard title="Milestones" subtitle="Tracked by work category">
            <MilestoneTimeline milestones={projectMilestones} />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-5 d-flex flex-column gap-3 gap-lg-4">
          <ChartCard title="Cost breakdown" subtitle="Estimated vs actual by cost category">
            {projectBudget.length === 0 ? (
              <p className="bt-text-muted small mb-0">
                No cost lines have been recorded for this project yet.
              </p>
            ) : (
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                {projectBudget.map((line) => {
                  const usage = Math.min(
                    100,
                    Math.round((line.actual / line.estimated) * 100),
                  );

                  return (
                    <li key={line.id}>
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                        <span className="bt-label mb-0">{line.category}</span>
                        <StatusBadge status={line.status} withDot={false} />
                      </div>

                      <ProgressBar
                        value={usage}
                        tone={
                          line.status === 'Over Budget'
                            ? 'danger'
                            : line.status === 'Near Limit'
                              ? 'warning'
                              : 'success'
                        }
                        label={`${line.category} utilisation`}
                      />

                      <div className="d-flex justify-content-between mt-1">
                        <span className="bt-label mb-0">
                          {formatCurrency(line.actual)} of {formatCurrency(line.estimated)}
                        </span>
                        <span className="bt-label mb-0">{usage}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ChartCard>

          <ChartCard title="Activity log" subtitle="Recent events on this site">
            {projectActivity.length === 0 ? (
              <p className="bt-text-muted small mb-0">
                No activity has been logged for this project yet.
              </p>
            ) : (
              <ActivityFeed entries={projectActivity} />
            )}
          </ChartCard>
        </div>
      </div>
    </>
  );
}
