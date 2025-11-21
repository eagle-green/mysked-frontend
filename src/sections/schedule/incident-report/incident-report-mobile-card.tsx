import { usePopover } from 'minimal-shared/hooks';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks/use-router';

//--------------------------------------------------------------------------------

type Props = {
  row: any;
  onDelete: (id: string) => void;
  onQuickEdit: (timeOff: any) => void;
};

export function IncidentReportMobileCard({ row, onDelete, onQuickEdit }: Props) {
  const router = useRouter();
  const menuActions = usePopover();

  return (
    <>
      <Card
        sx={{
          p: 2,
          cursor: 'default',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="primary">
            Type
          </Typography>
        </Stack>
      </Card>
    </>
  );
}
