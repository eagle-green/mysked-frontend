# Junior Engineer Onboarding - Digital Timecard Project

## Welcome! 👋

You'll be working on the **Digital Timecard** feature - an important part of MySked that helps track worker hours and manage payroll.

## Your Development Scope

### ✅ Your Work Areas
- `mysked-frontend/src/sections/timecard/` - Main timecard pages
- `mysked-frontend/src/components/timecard/` - Reusable timecard components
- `mysked-frontend/src/types/timecard.ts` - Type definitions
- `mysked-frontend/src/hooks/use-timecard.ts` - Custom React hooks
- `mysked-frontend/src/utils/timecard/` - Helper functions

### ❌ Restricted Areas (Initially)
- `mysked-backend/` - Backend code (handled by senior engineer)
- `mysked-frontend/src/lib/axios.ts` - API configuration
- `mysked-frontend/src/auth/` - Authentication logic
- Environment files (`.env*`)
- Package configuration files

## Quick Start

1. **Clone and setup**
   ```bash
   git clone [repository-url]
   cd mysked/mysked-frontend
   yarn install
   ```

2. **Start development**
   ```bash
   yarn dev
   ```

3. **Create your feature branch**
   ```bash
   git checkout -b feature/timecard-[your-name]-[task-name]
   ```

## What You'll Build

### Week 1: Basic Timecard Form
- Time input components (Travel, Shift, Break times)
- Distance input fields
- Auto-calculation of totals
- Form validation

### Week 2: Timecard Management
- List view of timecards
- Manager assignment interface
- Status management (draft, submitted, approved)

### Week 3: Enhanced Features
- Digital signature capture
- Mobile-responsive design
- Error handling and loading states

## Development Guidelines

### Code Style
- Use TypeScript for all files
- Follow existing Material-UI patterns
- Add proper error handling
- Include loading states
- Make components responsive

### File Naming
- Components: `TimecardForm.tsx`, `TimecardManager.tsx`
- Hooks: `use-timecard-form.ts`
- Utils: `timecard-calculations.ts`

### Import Best Practices
```typescript
// ✅ Good - relative imports within your scope
import { TimecardForm } from '../components/TimecardForm';
import { useTimecard } from '../hooks/use-timecard';
import type { TimecardEntry } from '../types/timecard';

// ❌ Avoid - importing from restricted areas
import axios from 'src/lib/axios'; // Use the provided hooks instead
```

## Need Help?

1. **Check documentation first** - README files in each directory
2. **Ask questions** - Daily standup or team chat
3. **Schedule 1:1 time** - For complex technical discussions
4. **Code review feedback** - Learn from PR comments

## Getting Access to More Code

As you demonstrate competency, you'll gradually get access to:
- Level 2: General frontend components
- Level 3: API integration files
- Level 4: Full frontend access
- Level 5: Backend access

This progressive approach helps you learn the codebase safely while building confidence.

## Success Metrics

- Clean, readable TypeScript code
- Responsive components that work on mobile
- Proper error handling and user feedback
- Following established patterns and conventions
- Active participation in code reviews

Remember: Ask questions early and often! We're here to help you succeed. 🚀
