// ----------------------------------------------------------------------

export const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'feature':
      return 'primary';
    case 'bug fix':
      return 'error';
    case 'improvement':
      return 'info';
    case 'announcement':
      return 'success';
    case 'maintenance':
      return 'warning';
    default:
      return 'default';
  }
};

// ----------------------------------------------------------------------

export const getCategoryOptions = () => [
  { label: 'Feature', value: 'Feature', color: getCategoryColor('Feature') },
  { label: 'Bug Fix', value: 'Bug Fix', color: getCategoryColor('Bug Fix') },
  { label: 'Improvement', value: 'Improvement', color: getCategoryColor('Improvement') },
  { label: 'Announcement', value: 'Announcement', color: getCategoryColor('Announcement') },
  { label: 'Maintenance', value: 'Maintenance', color: getCategoryColor('Maintenance') },
];
