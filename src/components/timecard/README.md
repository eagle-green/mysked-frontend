# Timecard Components

This directory contains reusable components specific to the Digital Timecard feature.

## Component Guidelines

### Naming Convention
- Use PascalCase for component names
- Prefix with "Timecard" for clarity
- Examples: `TimecardTimeInput`, `TimecardSignaturePad`, `TimecardStatusBadge`

### Component Structure
```typescript
interface ComponentProps {
  // Define all props with TypeScript
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Reusable Components to Create

1. **TimecardTimeInput** - Time input with validation
2. **TimecardDistanceInput** - Distance input with km formatting
3. **TimecardCalculatedField** - Read-only calculated totals
4. **TimecardStatusBadge** - Visual status indicator
5. **TimecardSignaturePad** - Digital signature capture
6. **TimecardManagerSelect** - Dropdown for selecting managers

## Testing

- Add unit tests for all components
- Test edge cases and error states
- Ensure mobile responsiveness
- Verify accessibility features
