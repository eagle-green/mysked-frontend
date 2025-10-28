import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useGetUpdateById } from 'src/actions/updates';

import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';

// ----------------------------------------------------------------------

export function UpdateDetailsView() {
  const { id } = useParams();

  const { data: update, isLoading, error } = useGetUpdateById(id!);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !update) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Update not found!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The update you&apos;re looking for doesn&apos;t exist or has been removed.
        </Typography>
        <Button
          component={RouterLink}
          href={paths.management.updates.list}
          startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
          variant="contained"
        >
          Back to list
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          {update.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {update.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Chip label={update.category} variant="soft" color="primary" />
          <Typography variant="body2" color="text.secondary">
            By {update.author.name} • {new Date(update.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ typography: 'body1' }}>
        <Markdown children={update.content} />
      </Box>
    </Container>
  );
}
