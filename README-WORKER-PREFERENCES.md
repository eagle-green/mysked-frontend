# 🚀 Worker Preference System

This document explains the new worker preference filtering system that provides intelligent employee suggestions based on Company, Site, and Client preferences.

## ✨ Features

### 1. **Preference-Based Filtering**
- **Preferred employees** (light green background) shown first
- **Regular employees** (no background) shown normally  
- **Not preferred employees** (light yellow background) shown with warnings
- **Mandatory restrictions** (light red background) hidden by default

### 2. **Visual Preference Indicators**
- **3 circles** showing Company|Site|Client preferences
- `●○○` = Company preferred only
- `●●○` = Company + Site preferred  
- `●●●` = All three preferred
- `○○○` = No preferences

### 3. **Smart Warnings**
- **Warning dialogs** for not-preferred selections (can proceed)
- **Blocking dialogs** for mandatory restrictions (cannot proceed)
- **Consolidated reasons** from multiple preference sources

### 4. **View All Toggle**
- **Default**: Hides mandatory not-preferred employees
- **View All ON**: Shows all employees with visual indicators

## 🎯 Demo

Visit the **Job List page** to see the interactive demo with mock data showing all filtering states.

## 🔧 Integration

### New Components Created:

1. **`/src/types/preference.ts`** - TypeScript interfaces
2. **`/src/components/preference/preference-indicators.tsx`** - 3-circle indicators
3. **`/src/components/preference/worker-warning-dialog.tsx`** - Warning dialogs
4. **`/src/sections/work/job/enhanced-worker-item.tsx`** - Enhanced worker selection
5. **`/src/sections/work/job/job-worker-demo.tsx`** - Interactive demo

### To Replace Existing Worker Selection:

1. **Import the enhanced component:**
```tsx
import { EnhancedWorkerItem } from './enhanced-worker-item';
```

2. **Replace WorkerItem with EnhancedWorkerItem:**
```tsx
// OLD
<WorkerItem
  workerFieldNames={getWorkerFieldNames(index)}
  employeeOptions={employeeOptions}
  // ... other props
/>

// NEW  
<EnhancedWorkerItem
  workerFieldNames={getWorkerFieldNames(index)}
  employeeOptions={employeeOptions}
  viewAllWorkers={viewAllWorkers}
  // ... simpler props (no restriction logic needed)
/>
```

3. **Add View All toggle to Workers section:**
```tsx
<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
  <Typography variant="h6" sx={{ color: 'text.disabled' }}>
    Workers:
  </Typography>
  <FormControlLabel
    control={
      <Switch
        checked={viewAllWorkers}
        onChange={(e) => setViewAllWorkers(e.target.checked)}
        size="small"
      />
    }
    label={<Typography variant="body2" color="text.secondary">View All</Typography>}
  />
</Box>
```

## 🎨 How It Works

### Data Flow:
1. **Fetch Preferences** → Company, Site, Client preferences for current job
2. **Enhance Employees** → Add preference metadata to each employee option
3. **Smart Filtering** → Hide/show based on View All toggle and restrictions
4. **Visual Feedback** → Background colors and preference indicators
5. **Warning System** → Show appropriate dialogs based on selection

### Priority Sorting:
1. **Preferred employees** (by preference count: 3 > 2 > 1)
2. **Regular employees** (no preferences)
3. **Not preferred employees** (with warnings)
4. **Mandatory restrictions** (hidden by default)

## 🔮 Future Enhancements

- **Worker-to-Worker conflict checking**
- **Bulk preference management**  
- **Preference analytics and reporting**
- **Custom preference categories**

## 🐛 Troubleshooting

**Q: Preferences not loading?**
A: Check that Company, Site, and Client are selected and have valid IDs.

**Q: All employees showing as regular?**
A: Verify preference API endpoints are working and returning data.

**Q: Warning dialogs not showing?**
A: Ensure WorkerWarningDialog component is properly imported and rendered.

---

*This system intelligently filters workers based on location and client preferences, improving job assignment accuracy and reducing scheduling conflicts.* 