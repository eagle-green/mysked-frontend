import type { ICalendarView } from 'src/types/calendar';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const VIEW_OPTIONS = [
  { value: 'dayGridMonth', label: 'Month', icon: 'mingcute:calendar-month-line' },
  { value: 'listWeek', label: 'List', icon: 'custom:calendar-agenda-outline' },
] as const;

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  canReset: boolean;
  view: ICalendarView;
  title: string;
  onToday: () => void;
  onNextDate: () => void;
  onPrevDate: () => void;
  onOpenFilters: () => void;
  onChangeView: (newView: ICalendarView) => void;
};

export function CalendarToolbar({
  title,
  view,
  loading,
  onToday,
  canReset,
  onNextDate,
  onPrevDate,
  onChangeView,
  onOpenFilters,
}: Props) {
  const mobileActions = usePopover();

  const selectedView = VIEW_OPTIONS.find((option) => option.value === view) ?? VIEW_OPTIONS[0];

  const renderDesktopMenuItems = () => (
    <ToggleButtonGroup
      exclusive
      size="small"
      aria-label="calendar view"
      value={view}
      onChange={(event: React.MouseEvent<HTMLElement>, newAlignment: ICalendarView | null) => {
        if (newAlignment !== null) {
          onChangeView(newAlignment);
        }
      }}
      sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
    >
      {VIEW_OPTIONS.map((option) => (
        <Tooltip key={option.value} title={option.label}>
          <ToggleButton value={option.value} aria-label={`${option.label} view`}>
            <Iconify icon={option.icon} />
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );

  const renderMobileMenuItems = () => (
    <>
      <Button
        size="small"
        color="inherit"
        onClick={mobileActions.onOpen}
        sx={{ minWidth: 'auto', display: { sm: 'none' } }}
      >
        <Iconify icon={selectedView.icon} sx={{ mr: 0.5 }} />
        <Iconify icon="eva:arrow-ios-downward-fill" width={18} />
      </Button>

    <CustomPopover
        open={mobileActions.open}
        anchorEl={mobileActions.anchorEl}
        onClose={mobileActions.onClose}
      slotProps={{ arrow: { placement: 'top-left' } }}
    >
      <MenuList>
          {VIEW_OPTIONS.map((option) => (
          <MenuItem
              key={option.value}
              selected={option.value === view}
            onClick={() => {
                mobileActions.onClose();
                onChangeView(option.value);
            }}
          >
              <Iconify icon={option.icon} />
              {option.label}
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
    </>
  );

  const renderDateNavigation = () => (
      <Box
        sx={{
        gap: { sm: 1 },
          display: 'flex',
        flex: '1 1 auto',
        textAlign: 'center',
          alignItems: 'center',
        justifyContent: 'center',
        }}
      >
          <IconButton onClick={onPrevDate}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

      <Box sx={{ typography: { xs: 'subtitle2', sm: 'h6' } }}>{title}</Box>

          <IconButton onClick={onNextDate}>
            <Iconify icon="eva:arrow-ios-forward-fill" />
          </IconButton>
        </Box>
  );

  const renderTodayAndFilters = () => (
        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
          <Button size="small" color="error" variant="contained" onClick={onToday}>
            Today
          </Button>

          <IconButton onClick={onOpenFilters}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="ic:round-filter-list" />
            </Badge>
          </IconButton>
        </Box>
  );

  const renderLoading = () => (
          <LinearProgress
            color="inherit"
            sx={{
              left: 0,
              width: 1,
              height: 2,
              bottom: 0,
              borderRadius: 0,
              position: 'absolute',
            }}
          />
  );

  return (
    <Box
      sx={{ pr: 2, pl: 2.5, py: 2.5, display: 'flex', alignItems: 'center', position: 'relative' }}
    >
      {renderDesktopMenuItems()}
      {renderMobileMenuItems()}
      {renderDateNavigation()}
      {renderTodayAndFilters()}
      {loading && renderLoading()}
      </Box>
  );
}
