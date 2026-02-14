import { useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
};

export function JobDispatchNoteZoomControls({
  zoomLevel,
  onZoomChange,
  minZoom = 0.5,
  maxZoom = 2.0,
  step = 0.1,
}: Props) {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + step, maxZoom);
    onZoomChange(Math.round(newZoom * 10) / 10);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - step, minZoom);
    onZoomChange(Math.round(newZoom * 10) / 10);
  };

  const handleReset = () => {
    onZoomChange(1.0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          handleZoomIn();
        } else if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          handleZoomOut();
        } else if (event.key === '0') {
          event.preventDefault();
          handleReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomLevel]);

  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Tooltip title="Zoom out (Ctrl/Cmd + -)">
        <span>
          <IconButton
            size="small"
            onClick={handleZoomOut}
            disabled={zoomLevel <= minZoom}
          >
            <Iconify icon={"solar:round-alt-arrow-down-bold" as any} />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Reset zoom (Ctrl/Cmd + 0)">
        <Button
          size="small"
          variant="outlined"
          onClick={handleReset}
          sx={{ minWidth: 70, px: 1 }}
        >
          <Typography variant="caption">{zoomPercent}%</Typography>
        </Button>
      </Tooltip>

      <Tooltip title="Zoom in (Ctrl/Cmd + +)">
        <span>
          <IconButton
            size="small"
            onClick={handleZoomIn}
            disabled={zoomLevel >= maxZoom}
          >
            <Iconify icon={"solar:round-alt-arrow-up-bold" as any} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
