import { useState } from 'react';

import { PROJECT_CATEGORIES, PROJECT_STATUSES } from '../../types';
import {
  isValid,
  requiredField,
  validatePositiveNumber,
  type FieldErrors,
} from '../../utils/validation';
import { Modal } from '../common/Modal';
import { FormField } from './FormField';

interface ProjectFormValues {
  name: string;
  category: string;
  status: string;
  client: string;
  location: string;
  projectManager: string;
  startDate: string;
  targetEndDate: string;
  budgetAllocated: string;
  description: string;
}

const EMPTY_FORM: ProjectFormValues = {
  name: '',
  category: '',
  status: 'Planning',
  client: '',
  location: '',
  projectManager: '',
  startDate: '',
  targetEndDate: '',
  budgetAllocated: '',
  description: '',
};

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (projectName: string) => void;
}

/**
 * "Create Project" form — document module 2, feature (i).
 *
 * The Figma's sidebar button was labelled "New Deployment", which does not
 * match the document's terminology; it is "New Project" throughout.
 */
export function NewProjectModal({ open, onClose, onCreated }: NewProjectModalProps) {
  const [values, setValues] = useState<ProjectFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<ProjectFormValues>>({});
  const [submitting, setSubmitting] = useState(false);

  function setField(field: keyof ProjectFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(): FieldErrors<ProjectFormValues> {
    const next: FieldErrors<ProjectFormValues> = {
      name: requiredField(values.name, 'Project name'),
      category: requiredField(values.category, 'Project category'),
      client: requiredField(values.client, 'Client'),
      location: requiredField(values.location, 'Site location'),
      projectManager: requiredField(values.projectManager, 'Project manager'),
      startDate: requiredField(values.startDate, 'Start date'),
      targetEndDate: requiredField(values.targetEndDate, 'Target end date'),
      budgetAllocated: validatePositiveNumber(values.budgetAllocated, 'Allocated budget'),
    };

    if (
      !next.startDate &&
      !next.targetEndDate &&
      values.targetEndDate <= values.startDate
    ) {
      next.targetEndDate = 'Target end date must be after the start date.';
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setSubmitting(true);

    // Stands in for POST /projects against the FastAPI backend.
    window.setTimeout(() => {
      setSubmitting(false);
      onCreated(values.name);
      setValues(EMPTY_FORM);
      setErrors({});
      onClose();
    }, 500);
  }

  function handleClose() {
    setValues(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Create project"
      description="Register a new construction project and assign its delivery team."
      onClose={handleClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline-bt" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="new-project-form"
            className="btn btn-accent"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create project'}
          </button>
        </>
      }
    >
      <form id="new-project-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <FormField
              label="Project name"
              value={values.name}
              onChange={(value) => setField('name', value)}
              error={errors.name}
              placeholder="e.g. Green Valley Residency"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <FormField
              as="select"
              label="Project category"
              value={values.category}
              onChange={(value) => setField('category', value)}
              options={PROJECT_CATEGORIES}
              error={errors.category}
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <FormField
              label="Client"
              value={values.client}
              onChange={(value) => setField('client', value)}
              error={errors.client}
              placeholder="e.g. Greenfield Developers"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <FormField
              label="Site location"
              value={values.location}
              onChange={(value) => setField('location', value)}
              error={errors.location}
              placeholder="e.g. Sector 12, Coimbatore"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <FormField
              label="Project manager"
              value={values.projectManager}
              onChange={(value) => setField('projectManager', value)}
              error={errors.projectManager}
              placeholder="Assign a project manager"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <FormField
              as="select"
              label="Initial status"
              value={values.status}
              onChange={(value) => setField('status', value)}
              options={PROJECT_STATUSES}
              placeholderOption="Select status"
            />
          </div>

          <div className="col-12 col-md-4">
            <FormField
              type="date"
              label="Start date"
              value={values.startDate}
              onChange={(value) => setField('startDate', value)}
              error={errors.startDate}
              required
            />
          </div>

          <div className="col-12 col-md-4">
            <FormField
              type="date"
              label="Target end date"
              value={values.targetEndDate}
              onChange={(value) => setField('targetEndDate', value)}
              error={errors.targetEndDate}
              required
            />
          </div>

          <div className="col-12 col-md-4">
            <FormField
              type="number"
              label="Allocated budget (₹)"
              value={values.budgetAllocated}
              onChange={(value) => setField('budgetAllocated', value)}
              error={errors.budgetAllocated}
              placeholder="5500000"
              min={0}
              required
            />
          </div>

          <div className="col-12">
            <FormField
              as="textarea"
              label="Scope description"
              value={values.description}
              onChange={(value) => setField('description', value)}
              placeholder="Brief description of the works covered by this project."
              rows={3}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
