# Timecard Sections

This directory contains all the main page sections for the Digital Timecard feature.

## Structure

- `timecard-list.tsx` - List view of all timecards
- `timecard-form.tsx` - Form for creating/editing timecards
- `timecard-view.tsx` - Detailed view of a single timecard
- `timecard-manager.tsx` - Manager dashboard for timecard approval

## Component Guidelines

- Use Material-UI components consistently
- Follow the existing design patterns from other sections
- Include proper loading states and error handling
- Implement responsive design for mobile use
- Add accessibility attributes (aria-labels, etc.)

## Development Notes

- All API calls should use the provided timecard hooks
- Form validation should use the timecard validation utilities
- Keep components focused and reusable
- Add TypeScript interfaces for all props
