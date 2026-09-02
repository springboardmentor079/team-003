import { useState } from 'react';
import { Link } from 'react-router-dom';

import { BarChart } from '../../components/charts/BarChart';
import { chartColors } from '../../components/charts/chartTheme';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { ChartCard, LegendChip } from '../../components/dashboard/ChartCard';
import { MilestoneTimeline } from '../../components/dashboard/MilestoneTimeline';
import { ResourceAllocationList } from '../../components/dashboard/ResourceAllocationList';
import { StatCard } from '../../components/dashboard/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { overviewKpis } from '../../data/analytics';
import { milestones, projects } from '../../data/projects';
import { resourceAllocation } from '../../data/resources';
import {
  activityLog,
  progressReports,
  weeklyProgressTrend,
  workCategoryProgress,
} from '../../data/siteProgress';
import { formatDate } from '../../utils/format';

/**
 * Top-bar tabs from the Figma. "Incident Log" is renamed to "Activity Log" —
 * the document defines Site Activity Logs (module 3, feature vi) and has no
 * incident-management feature.
 */
const TABS = ['Active Sites', 'Activity Log', 'Reports'] as const;
type Tab = (typeof TABS)[number];

/**
 * Overview dashboard, rebuilt from the Figma "overview" frame.
 *
 * Corrections against the document:
 *  - "Machine Utilization" → "Resource Utilization" (module 4 terminology).
 *  - The "Site Telemetry" live camera card is replaced by Site Progress
 *    Monitoring; the document specifies progress reporting, not video feeds.
 *  - Resource Allocation now lists all six document resource categories.
 *  - Milestones use the six document work categories.
 */
export function OverviewPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('Active Sites');

  const featured = projects[0];
  const featuredMilestones = milestones.filter(
    (milestone) => milestone.projectId === featured.id,
  );
  const featuredReports = progressReports.filter(
    (report) => report.projectId === featured.id,
  );

  return (
    <>
      {/* Section tabs */}
      <div
        className="d-flex flex-wrap gap-4 mb-4 pb-1 border-bottom"
        style={{ borderColor: 'var(--bt-border)' }}
        role="tablist"
        aria-label="Overview sections"
      >
        {TABS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={tab === option}
            className={`bt-tab ${tab === option ? 'active' : ''}`.trim()}
            onClick={() => setTab(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Featured project header */}
      <header className="mb-4">
        <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
          <StatusBadge status={featured.status} />
          <span className="bt-label mb-0">Project ID: {featured.code}</span>
          <span className="bt-label mb-0">{featured.category}</span>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-8">
            <h1
              className="bt-display mb-0"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', lineHeight: 1.05 }}
            >
              {featured.name}
            </h1>
            <p className="bt-text-dim mb-0 mt-2">
              {featured.location} · Client: {featured.client} · Target completion{' '}
              {formatDate(featured.targetEndDate)}
            </p>
          </div>

          <div className="col-12 col-lg-4 text-lg-end">
            <p className="bt-label mb-1">Overall progress</p>
            <p className="mb-0">
              <span className="bt-display bt-accent" style={{ fontSize: '2.4rem' }}>
                {featured.progress}
              </span>
              <span className="bt-accent">%</span>
            </p>
          </div>

          <div className="col-12">
            <ProgressBar
              value={featured.progress}
              tone="accent"
              height={3}
              label={`${featured.name} overall progress`}
            />
          </div>
        </div>
      </header>

      {/* ---------------- Active Sites ---------------- */}
      {tab === 'Active Sites' && (
        <>
          <div className="row g-3 g-lg-4 mb-4">
            {overviewKpis.map((metric) => (
              <div className="col-12 col-sm-6 col-xl-3" key={metric.id}>
                <StatCard
                  metric={metric}
                  sparkline={
                    metric.id === 'ov-progress'
                      ? weeklyProgressTrend.map((point) => point.value)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>

          <div className="row g-3 g-lg-4 mb-4">
            <div className="col-12 col-xl-8">
              <ChartCard
                title="Site Progress Monitoring"
                subtitle="Planned vs actual completion by work category"
                actions={
                  <>
                    <LegendChip label="Planned" color={chartColors.green} />
                    <LegendChip label="Actual" color={chartColors.accent} />
                  </>
                }
              >
                <BarChart
                  labels={workCategoryProgress.map((entry) => entry.category)}
                  series={[
                    {
                      label: 'Planned',
                      values: workCategoryProgress.map((entry) => entry.planned),
                      color: chartColors.green,
                    },
                    {
                      label: 'Actual',
                      values: workCategoryProgress.map((entry) => entry.actual),
                      color: chartColors.accent,
                    },
                  ]}
                  valueSuffix="%"
                  yMax={100}
                  height={300}
                  ariaLabel="Planned versus actual completion by work category"
                />
              </ChartCard>
            </div>

            <div className="col-12 col-xl-4">
              <ChartCard
                title="Resource Allocation"
                subtitle="Active units per resource category"
                actions={
                  <Link to="/app/resources" className="bt-label bt-label-accent mb-0">
                    Manage
                  </Link>
                }
              >
                <ResourceAllocationList allocation={resourceAllocation} />
              </ChartCard>
            </div>
          </div>

          <div className="row g-3 g-lg-4">
            <div className="col-12 col-xl-8">
              <ChartCard
                title="Project Timeline"
                subtitle="Milestones by work category"
                actions={
                  <Link
                    to={`/app/projects/${featured.code}`}
                    className="bt-label bt-label-accent mb-0"
                  >
                    View full milestones
                  </Link>
                }
              >
                <MilestoneTimeline milestones={featuredMilestones} />
              </ChartCard>
            </div>

            <div className="col-12 col-xl-4">
              <ChartCard
                title="Recent Activity"
                subtitle="Site activity log"
                actions={
                  <button
                    type="button"
                    className="bt-label bt-label-accent mb-0 btn btn-ghost p-0"
                    onClick={() => setTab('Activity Log')}
                  >
                    View full log
                  </button>
                }
              >
                <ActivityFeed entries={activityLog} limit={4} />
              </ChartCard>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Activity Log ---------------- */}
      {tab === 'Activity Log' && (
        <ChartCard
          title="Site Activity Log"
          subtitle="All logged site events across the portfolio"
        >
          <ActivityFeed entries={activityLog} />
        </ChartCard>
      )}

      {/* ---------------- Reports ---------------- */}
      {tab === 'Reports' && (
        <ChartCard
          title="Progress Reports"
          subtitle={`Daily and weekly reports for ${featured.name}`}
          actions={
            <Link to="/app/reports" className="bt-label bt-label-accent mb-0">
              All reports
            </Link>
          }
        >
          <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
            {featuredReports.map((report) => (
              <li
                key={report.id}
                className="p-3 rounded-3"
                style={{
                  background: 'var(--bt-surface-2)',
                  border: '1px solid var(--bt-border)',
                }}
              >
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <StatusBadge status={report.status} />
                    <span className="bt-label mb-0">
                      {report.frequency} · {report.workCategory}
                    </span>
                  </div>
                  <span className="bt-label mb-0">{formatDate(report.reportDate)}</span>
                </div>

                <p className="small mb-2">{report.workCompleted}</p>

                <div className="d-flex flex-wrap justify-content-between gap-2">
                  <span className="bt-label mb-0">Submitted by {report.submittedBy}</span>
                  <span className="bt-label mb-0">
                    Completion: {report.completionPercent}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      <p className="bt-label mt-4 mb-0">
        Signed in as {user?.fullName} · {user?.role}
      </p>
    </>
  );
}
