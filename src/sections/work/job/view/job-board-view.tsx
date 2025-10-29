import type { Dayjs } from 'dayjs';
import type { IJob } from 'src/types/job';
import type { DragEndEvent ,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  CollisionDetection,
} from '@dnd-kit/core';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useRef, useMemo, useState, useCallback } from 'react';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSensor,
  DndContext,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  closestCorners,
  KeyboardSensor,
  getFirstCollision,
  MeasuringStrategy,
} from '@dnd-kit/core';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { coordinateGetter } from '../kanban-utils';
import { JobBoardColumn } from '../../board/job-board-column';

// ----------------------------------------------------------------------

type ViewMode = 'day' | 'week';

type BoardColumn = {
  id: string;
  name: string;
  date: Date;
};

type BoardData = {
  columns: BoardColumn[];
  jobs: Record<string, IJob[]>;
};

// ----------------------------------------------------------------------

export function JobBoardView() {
  const recentlyMovedToNewContainer = useRef(false);
  const lastOverId = useRef<UniqueIdentifier | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Week navigation functions
  const handlePrevWeek = useCallback(() => {
    if (selectedDate) {
      setSelectedDate(selectedDate.subtract(1, 'week'));
    }
  }, [selectedDate]);

  const handleNextWeek = useCallback(() => {
    if (selectedDate) {
      setSelectedDate(selectedDate.add(1, 'week'));
    }
  }, [selectedDate]);

  // Get week range text (e.g., "Oct 20 - 26, 2025")
  const getWeekRangeText = useCallback((date: Dayjs | null) => {
    if (!date) return '';

    const startOfWeek = date.startOf('week');
    const endOfWeek = date.endOf('week');

    const startMonth = startOfWeek.format('MMM');
    const startDay = startOfWeek.format('D');
    const endMonth = endOfWeek.format('MMM');
    const endDay = endOfWeek.format('D');
    const year = startOfWeek.format('YYYY');

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }, []);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const selected = selectedDate || dayjs();

    if (viewMode === 'day') {
      return {
        startDate: selected.startOf('day'),
        endDate: selected.endOf('day'),
      };
    }

    // Week view - Monday to Sunday
    const dayOfWeek = selected.day();
    const monday = selected.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day').startOf('day');
    const sunday = monday.add(6, 'day').endOf('day');

    return {
      startDate: monday,
      endDate: sunday,
    };
  }, [viewMode, selectedDate]);

  // Fetch jobs from API with date filtering
  const { data: jobResponse } = useQuery({
    queryKey: [
      'jobs',
      'board-view',
      viewMode,
      dateRange.startDate.toISOString(),
      dateRange.endDate.toISOString(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        page: '1',
        rowsPerPage: '1000', // Get all jobs in range
      });

      // Fetch both regular jobs and open jobs using the same endpoint with different filters
      const [regularJobsResponse, openJobsResponse] = await Promise.all([
        fetcher(`${endpoints.work.job}?${params.toString()}&is_open_job=false`),
        fetcher(`${endpoints.work.job}?${params.toString()}&is_open_job=true`),
      ]);

      // Combine both job types
      const regularJobs = regularJobsResponse?.data?.jobs || [];
      const openJobs = openJobsResponse?.data?.jobs || [];

      return {
        data: {
          jobs: [...regularJobs, ...openJobs],
        },
      };
    },
  });


  // Search filtering function
  const filterJobsBySearch = useCallback((jobs: IJob[]) => {
    if (!searchQuery.trim()) return jobs;
    
    const query = searchQuery.toLowerCase().trim();
    
    return jobs.filter((job: IJob) => {
      // Search in company name
      if (job.company?.name?.toLowerCase().includes(query)) return true;
      
      // Search in client name
      if (job.client?.name?.toLowerCase().includes(query)) return true;
      
      // Search in site address
      if (job.site?.street_number?.toLowerCase().includes(query)) return true;
      if (job.site?.street_name?.toLowerCase().includes(query)) return true;
      if (job.site?.city?.toLowerCase().includes(query)) return true;
      if (job.site?.province?.toLowerCase().includes(query)) return true;
      if (job.site?.postal_code?.toLowerCase().includes(query)) return true;
      if (job.site?.display_address?.toLowerCase().includes(query)) return true;
      
      // Search in worker names and phone numbers
      if (job.workers?.some((worker: any) => {
        const fullName = `${worker.first_name || ''} ${worker.last_name || ''}`.toLowerCase();
        const phoneNumber = worker.phone_number || '';
        return fullName.includes(query) || phoneNumber.includes(query);
      })) return true;
      
      // Search in vehicle info
      if (job.vehicles?.some((vehicle: any) => {
        const licensePlate = vehicle.license_plate || '';
        const unitNumber = vehicle.unit_number || '';
        const vehicleType = vehicle.type || '';
        return licensePlate.toLowerCase().includes(query) || 
               unitNumber.toLowerCase().includes(query) ||
               vehicleType.toLowerCase().includes(query);
      })) return true;
      
      // Search in job number
      if (job.job_number?.toString().includes(query)) return true;
      
      return false;
    });
  }, [searchQuery]);

  // Generate columns based on view mode
  const boardData = useMemo<BoardData>(() => {
    // Extract jobs array from response - ensure it's always an array
    const fetchedJobs = Array.isArray(jobResponse?.data?.jobs) ? jobResponse.data.jobs : [];
    
    // Apply search filter to all jobs
    const filteredJobs = filterJobsBySearch(fetchedJobs);
    
    // Use filtered jobs from API
    const allJobs = filteredJobs;
    // Use allJobs from API
    const jobsArray = Array.isArray(allJobs) ? allJobs : [];

    if (viewMode === 'day') {
      // For day view, always use the selected date or default to today
      const selectedDay = selectedDate || dayjs();
      const today = dayjs();
      const tomorrow = today.add(1, 'day');

      // Determine if this is today or tomorrow
      let dayLabel = '';
      if (selectedDay.isSame(today, 'day')) {
        dayLabel = 'Today';
      } else if (selectedDay.isSame(tomorrow, 'day')) {
        dayLabel = 'Tomorrow';
      }

      // Format the column name with day name, date and label
      const dayName = selectedDay.format('dddd'); // "Monday", "Tuesday", etc.
      const dateStr = selectedDay.format('MMM D');
      const columnName = dayLabel ? `${dayName} ${dateStr} ${dayLabel}` : `${dayName} ${dateStr}`;

      const dayColumn: BoardColumn = {
        id: 'day-1',
        name: columnName,
        date: selectedDay.toDate(),
      };

      // Filter jobs for the selected day and sort by start time
      const dayJobs = jobsArray
        .filter((job: IJob) => {
          const jobStartDate = dayjs(job.start_time);
          return jobStartDate.isSame(selectedDay, 'day');
        })
        .sort((a: IJob, b: IJob) => {
          const timeA = dayjs(a.start_time);
          const timeB = dayjs(b.start_time);
          return timeA.diff(timeB);
        });

      return {
        columns: [dayColumn],
        jobs: {
          [dayColumn.id]: dayJobs,
        },
      };
    }

    // Week view - Monday to Sunday
    const today = selectedDate || dayjs();
    const dayOfWeek = today.day();
    const monday = today.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');

    const weekColumns: BoardColumn[] = [];
    const weekJobs: Record<string, IJob[]> = {};

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const date = monday.add(i, 'day');
      const columnId = `day-${i}`;

      // Determine if this is today or tomorrow
      const todayDate = dayjs();
      const tomorrow = todayDate.add(1, 'day');

      let dayLabel = '';
      if (date.isSame(todayDate, 'day')) {
        dayLabel = 'Today';
      } else if (date.isSame(tomorrow, 'day')) {
        dayLabel = 'Tomorrow';
      }

      // Format the column name with day name, date and label
      const dayName = dayNames[i];
      const dateStr = date.format('MMM D');
      const columnName = dayLabel ? `${dayName} ${dateStr} ${dayLabel}` : `${dayName} ${dateStr}`;

      weekColumns.push({
        id: columnId,
        name: columnName,
        date: date.toDate(),
      });

      // Filter jobs for this specific day and sort by start time
      weekJobs[columnId] = jobsArray
        .filter((job: IJob) => {
          const jobStartDate = dayjs(job.start_time);
          return jobStartDate.isSame(date, 'day');
        })
        .sort((a: IJob, b: IJob) => {
          const timeA = dayjs(a.start_time);
          const timeB = dayjs(b.start_time);
          return timeA.diff(timeB);
        });
    }

    return {
      columns: weekColumns,
      jobs: weekJobs,
    };
  }, [viewMode, selectedDate, jobResponse, filterJobsBySearch]);

  // Local state for managing job positions during drag operations
  const [draggedJobs, setDraggedJobs] = useState<Record<string, IJob[]> | null>(null);

  // Use dragged jobs if available (during drag), otherwise use boardData
  const jobs = draggedJobs || boardData.jobs;

  const columnIds = useMemo(
    () => boardData.columns.map((column) => column.id),
    [boardData.columns]
  );
  const isSortingContainer = activeId != null ? columnIds.includes(activeId as string) : false;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter })
  );

  const findColumn = useCallback(
    (id: UniqueIdentifier) => {
      if (id in jobs) {
        return id;
      }

      return Object.keys(jobs).find((key) => jobs[key].map((job) => job.id).includes(id as string));
    },
    [jobs]
  );

  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in jobs) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((column) => column.id in jobs),
        });
      }

      const pointerIntersections = pointerWithin(args);
      const cornersCollisions = closestCorners(args);
      const centerCollisions = closestCenter(args);

      const intersections =
        !!pointerIntersections.length && !!centerCollisions.length && !!cornersCollisions.length
          ? pointerIntersections
          : null;

      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId in jobs) {
          const columnItems = jobs[overId].map((job) => job.id);

          if (columnItems.length > 0) {
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (column) => column.id !== overId && columnItems.includes(column.id as string)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, jobs]
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    // Initialize dragged jobs state when drag starts
    setDraggedJobs(boardData.jobs);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    const overId = over?.id;

    if (overId == null || active.id in jobs) {
      return;
    }

    const overColumn = findColumn(overId);
    const activeColumn = findColumn(active.id);

    if (!overColumn || !activeColumn) {
      return;
    }

    if (activeColumn !== overColumn) {
      const activeItems = jobs[activeColumn].map((job) => job.id);
      const overItems = jobs[overColumn].map((job) => job.id);
      const overIndex = overItems.indexOf(overId as string);
      const activeIndex = activeItems.indexOf(active.id as string);

      let newIndex: number;

      if (overId in jobs) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;

        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      recentlyMovedToNewContainer.current = true;

      const currentJobs = draggedJobs || boardData.jobs;
      const updateJobs = {
        ...currentJobs,
        [activeColumn]: currentJobs[activeColumn].filter((job) => job.id !== active.id),
        [overColumn]: [
          ...currentJobs[overColumn].slice(0, newIndex),
          currentJobs[activeColumn][activeIndex],
          ...currentJobs[overColumn].slice(newIndex, currentJobs[overColumn].length),
        ],
      };

      setDraggedJobs(updateJobs);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const activeColumn = findColumn(active.id);

    if (!activeColumn) {
      setActiveId(null);
      setDraggedJobs(null);
      return;
    }

    const overId = over?.id;

    if (overId == null) {
      setActiveId(null);
      setDraggedJobs(null);
      return;
    }

    const overColumn = findColumn(overId);

    if (overColumn) {
      const currentJobs = draggedJobs || boardData.jobs;
      const activeContainerJobIds = currentJobs[activeColumn].map((job) => job.id);
      const overContainerJobIds = currentJobs[overColumn].map((job) => job.id);

      const activeIndex = activeContainerJobIds.indexOf(active.id as string);
      const overIndex = overContainerJobIds.indexOf(overId as string);

      if (activeIndex !== overIndex) {
        const updateJobs = {
          ...currentJobs,
          [overColumn]: arrayMove(currentJobs[overColumn], activeIndex, overIndex),
        };

        setDraggedJobs(updateJobs);
      }
    }

    setActiveId(null);
    // Clear dragged jobs after a brief delay to show final position
    setTimeout(() => setDraggedJobs(null), 100);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // When switching to day view, reset to today
    if (mode === 'day') {
      setSelectedDate(dayjs());
    }
  };

  return (
    <DashboardContent
      maxWidth={false}
      sx={{
        pb: 0,
        pl: { sm: 3 },
        pr: { sm: 0 },
        flex: '1 1 0',
        display: 'flex',
        overflowX: 'hidden',
        overflowY: 'auto',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ pr: { sm: 3 }, mb: { xs: 3, md: 5 } }}>
        <CustomBreadcrumbs
          heading="Board View"
          links={[{ name: 'Work Management' }, { name: 'Job' }, { name: 'Board View' }]}
          action={
            <Button
              component={RouterLink}
              href={paths.work.job.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add Job
            </Button>
          }
          sx={{ mb: 3 }}
        />

        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ButtonGroup variant="outlined" sx={{ bgcolor: 'background.paper' }}>
              <Button
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('day')}
                startIcon={<Iconify icon="mingcute:calendar-day-line" />}
              >
                Day View
              </Button>
              <Button
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('week')}
                startIcon={<Iconify icon="mingcute:calendar-week-line" />}
              >
                Week View
              </Button>
            </ButtonGroup>

            <TextField
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ color: 'text.disabled' }}
                    >
                      <Iconify icon="mingcute:close-line" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {viewMode === 'day' ? (
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 200 },
                },
              }}
            />
          ) : (
            <Box
              sx={{
                gap: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <IconButton onClick={handlePrevWeek} size="small">
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>

              <Box
                sx={{
                  typography: 'h6',
                  fontWeight: 600,
                  minWidth: '250px',
                  textAlign: 'center',
                  fontSize: '1.1rem',
                }}
              >
                {getWeekRangeText(selectedDate)}
              </Box>

              <IconButton onClick={handleNextWeek} size="small">
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>
            </Box>
          )}
        </Stack>
      </Box>

      <DndContext
        id="dnd-job-board"
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <Stack sx={{ flex: '1 1 auto', overflowX: 'auto', overflowY: 'visible', pr: { sm: 3 } }}>
          <Box
            sx={{
              pb: 3,
              display: 'flex',
              gap: 3,
              flex: '0 1 auto',
            }}
          >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {boardData.columns.map((column) => (
                <JobBoardColumn
                  key={column.id}
                  column={column}
                  jobs={jobs[column.id] || []}
                  disabled={isSortingContainer}
                  fullWidth={viewMode === 'day'}
                  viewMode={viewMode}
                />
              ))}
            </SortableContext>
          </Box>
        </Stack>
      </DndContext>
    </DashboardContent>
  );
}
