import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { BarChart } from '../components/charts/BarChart';
import { chartColors } from '../components/charts/chartTheme';
import { ProgressBar } from '../components/common/ProgressBar';
import { PublicLayout } from '../layouts/PublicLayout';
import { stockByCategory } from '../data/inventory';
import { shiftCoverage } from '../data/workforce';

type Phase = 'All' | 'Plan' | 'Build' | 'Monitor' | 'Deliver';

interface ModuleCard {
  title: string;
  description: string;
  icon: string;
  phase: Exclude<Phase, 'All'>;
}

/**
 * The eleven user-facing modules from the reference document.
 *
 * The Figma showed only six feature cards and omitted Budget & Cost
 * Management, Reports & Documentation, Notifications, Dashboards &
 * Analytics and Authentication & Role-Based Access. All are restored.
 */
const MODULES: ModuleCard[] = [
  {
    title: 'Project Management',
    description:
      'Create projects, schedule work, track milestones and status, and run project closure across five project categories.',
    icon: 'bi-diagram-3',
    phase: 'Plan',
  },
  {
    title: 'Budget & Cost Management',
    description:
      'Budget planning, cost estimation, expense tracking and financial reporting across six cost categories.',
    icon: 'bi-cash-coin',
    phase: 'Plan',
  },
  {
    title: 'Procurement Management',
    description:
      'Vendor and supplier management, purchase orders, procurement requests and invoice tracking.',
    icon: 'bi-cart3',
    phase: 'Plan',
  },
  {
    title: 'Site Progress Monitoring',
    description:
      'Daily and weekly progress reports, milestone tracking, work completion status, delay tracking and site activity logs.',
    icon: 'bi-clipboard-data',
    phase: 'Build',
  },
  {
    title: 'Workforce Management',
    description:
      'Worker registration, attendance tracking, workforce allocation, shift scheduling and payroll monitoring.',
    icon: 'bi-people',
    phase: 'Build',
  },
  {
    title: 'Material & Inventory',
    description:
      'Material procurement, inventory monitoring, material requests and allocation, and stock management.',
    icon: 'bi-box-seam',
    phase: 'Build',
  },
  {
    title: 'Resource Management',
    description:
      'Equipment allocation, machinery tracking, resource utilisation and availability, and maintenance scheduling.',
    icon: 'bi-truck-front',
    phase: 'Monitor',
  },
  {
    title: 'Notification System',
    description:
      'Project updates, task assignments, procurement and attendance alerts, deadline and system notifications.',
    icon: 'bi-bell',
    phase: 'Monitor',
  },
  {
    title: 'Dashboards & Analytics',
    description:
      'Role-specific dashboards for project managers and administrators, with progress, budget and utilisation analytics.',
    icon: 'bi-graph-up-arrow',
    phase: 'Monitor',
  },
  {
    title: 'Reports & Documentation',
    description:
      'Progress, resource, budget, workforce and procurement reports with PDF and Excel export.',
    icon: 'bi-file-earmark-bar-graph',
    phase: 'Deliver',
  },
  {
    title: 'Authentication & Access',
    description:
      'JWT authentication, password reset, profile management and role-based access across six user roles.',
    icon: 'bi-shield-lock',
    phase: 'Deliver',
  },
];

const PHASES: Phase[] = ['All', 'Plan', 'Build', 'Monitor', 'Deliver'];

/**
 * Public landing page, rebuilt from the Figma "dashboard" frame.
 *
 * The oversized wordmark watermark, the phase pill tabs and the module card
 * grid are preserved; the card content is corrected to the document's module
 * list, and the pills now actually filter the grid.
 */
export function LandingPage() {
  const [phase, setPhase] = useState<Phase>('All');

  const visibleModules = useMemo(
    () => (phase === 'All' ? MODULES : MODULES.filter((module) => module.phase === phase)),
    [phase],
  );

  return (
    <PublicLayout>
      {/* ---------------- Hero ---------------- */}
      <section
        id="platform"
        className="position-relative overflow-hidden"
        style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
      >
        <div
          className="position-absolute bt-display d-none d-md-block"
          style={{
            top: '18%',
            left: '-2%',
            fontSize: 'clamp(8rem, 17vw, 17rem)',
            lineHeight: 1,
            color: 'rgba(255,255,255,0.022)',
            letterSpacing: '-0.05em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          BUILDTRACK
        </div>

        <div className="container-xl position-relative">
          <h1
            className="bt-display mb-4"
            style={{
              fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.04em',
              maxWidth: 900,
            }}
          >
            Build better.
            <br />
            Manage smarter.
            <br />
            <span className="bt-accent">Deliver with confidence.</span>
          </h1>

          <div className="d-flex flex-wrap gap-4 gap-md-5 mb-5">
            <p className="bt-label mb-0" style={{ maxWidth: 220 }}>
              Construction management, centralized
            </p>
            <p className="bt-label mb-0" style={{ maxWidth: 220 }}>
              <span className="bt-accent me-2" aria-hidden="true">
                ●
              </span>
              Real-time project visibility
            </p>
          </div>

          <div className="d-flex flex-wrap gap-3">
            <Link to="/register" className="btn btn-accent px-4 py-2">
              Get started
              <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn-outline-bt px-4 py-2">
              Sign in to workspace
            </Link>
          </div>

          <p className="bt-label text-center mt-5 mb-0">
            Scroll to explore
            <i className="bi bi-arrow-down d-block mt-2" aria-hidden="true" />
          </p>
        </div>
      </section>

      {/* ---------------- Modules ---------------- */}
      <section
        id="modules"
        style={{ background: 'var(--bt-bg-alt)', padding: '4.5rem 0' }}
      >
        <div className="container-xl">
          <div className="text-center mb-4">
            <h2
              className="bt-display mb-0"
              style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.75rem)', lineHeight: 1.15 }}
            >
              Everything happening on your project.
              <br />
              <span className="bt-text-dim">One connected view.</span>
            </h2>
          </div>

          <div
            className="d-flex flex-wrap justify-content-center gap-2 mb-5"
            role="tablist"
            aria-label="Filter modules by project phase"
          >
            {PHASES.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={phase === option}
                className={`bt-pill-tab ${phase === option ? 'active' : ''}`.trim()}
                onClick={() => setPhase(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="row g-3 g-lg-4">
            {visibleModules.map((module) => (
              <div className="col-12 col-md-6 col-lg-4" key={module.title}>
                <article className="bt-card bt-card-hover bt-card-pad d-flex flex-column">
                  <span className="bt-icon-tile bt-green mb-3">
                    <i className={`bi ${module.icon}`} aria-hidden="true" />
                  </span>

                  <h3 className="h6 mb-2">{module.title}</h3>
                  <p className="bt-text-muted small mb-3 flex-grow-1">
                    {module.description}
                  </p>

                  <span className="bt-label mb-0">{module.phase} phase</span>
                </article>
              </div>
            ))}

            <div className="col-12 col-md-6 col-lg-4">
              <Link
                to="/login"
                className="bt-card bt-card-hover bt-card-pad d-flex flex-column align-items-center justify-content-center text-center h-100"
                style={{ borderStyle: 'dashed' }}
              >
                <span
                  className="bt-icon-tile rounded-circle mb-3"
                  style={{ border: '1px solid var(--bt-border-strong)' }}
                >
                  <i className="bi bi-arrow-right bt-accent" aria-hidden="true" />
                </span>
                <span className="h6 mb-1">Explore platform</span>
                <span className="bt-text-muted small">View all capabilities</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Live snapshot ---------------- */}
      <section id="progress" style={{ padding: '4.5rem 0' }}>
        <div className="container-xl">
          <div className="row g-4 align-items-stretch">
            <div className="col-12 col-lg-5">
              <h2 className="bt-display mb-3" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
                Track material stock and shift coverage as work happens.
              </h2>
              <p className="bt-text-dim mb-4">
                Inventory levels across all seven material categories and workforce
                deployment across all three shifts, updated from the field.
              </p>

              <div className="d-flex flex-column gap-3" id="resources">
                <div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="bt-label mb-0">Cement</span>
                    <span className="bt-label bt-label-green mb-0">82%</span>
                  </div>
                  <ProgressBar value={82} tone="success" label="Cement stock level" />
                </div>

                <div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="bt-label mb-0">Steel</span>
                    <span className="bt-label bt-label-accent mb-0">45%</span>
                  </div>
                  <ProgressBar value={45} tone="accent" label="Steel stock level" />
                </div>

                <div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="bt-label mb-0">Concrete</span>
                    <span className="bt-label bt-red mb-0">0%</span>
                  </div>
                  <ProgressBar value={0} tone="danger" label="Concrete stock level" />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <article className="bt-card bt-card-pad d-flex flex-column">
                <h3 className="h6 mb-1">Material stock level</h3>
                <p className="bt-label mb-3">Percent of reorder target, by category</p>
                <BarChart
                  labels={stockByCategory.map((entry) => entry.label)}
                  series={[
                    { label: 'Stock level', values: stockByCategory.map((e) => e.value) },
                  ]}
                  pointColors={stockByCategory.map((entry) =>
                    entry.value === 0
                      ? chartColors.red
                      : entry.value < 50
                        ? chartColors.accent
                        : chartColors.green,
                  )}
                  valueSuffix="%"
                  yMax={100}
                  height={230}
                  ariaLabel="Material stock level by category"
                />
              </article>
            </div>

            <div className="col-12 col-lg-3" id="analytics">
              <article className="bt-card bt-card-pad d-flex flex-column">
                <h3 className="h6 mb-1">Shift coverage</h3>
                <p className="bt-label mb-3">Personnel deployed per shift</p>
                <BarChart
                  labels={shiftCoverage.map((entry) => entry.label)}
                  series={[
                    { label: 'Personnel', values: shiftCoverage.map((e) => e.value) },
                  ]}
                  pointColors={[chartColors.accent, chartColors.green, chartColors.blue]}
                  height={230}
                  ariaLabel="Workforce deployed per shift"
                />
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section style={{ background: 'var(--bt-bg-alt)', padding: '4rem 0' }}>
        <div className="container-xl text-center">
          <h2 className="bt-display mb-3" style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.5rem)' }}>
            Ready to bring every site into one view?
          </h2>
          <p className="bt-text-dim mb-4 mx-auto" style={{ maxWidth: 560 }}>
            Sign in to the workspace to manage projects, monitor site progress, and
            generate reports across your portfolio.
          </p>
          <Link to="/login" className="btn btn-accent px-4 py-2">
            Sign in to workspace
            <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
