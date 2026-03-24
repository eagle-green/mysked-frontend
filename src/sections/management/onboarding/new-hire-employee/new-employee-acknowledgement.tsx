import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function NewEmployeeAcknowledgement() {
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  return (
    <>
      <>
        <Stack>
          <Typography variant="h5">Review & Acknowledgement</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* EG Safety Protocols */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">EG - Safety Protocols</Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Company Rules */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Company Rules</Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Motive Cameras */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Motive Cameras</Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* HR - 703 */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Human Resource - Drug and Alcohol</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-703
              </Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* HR 704 */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Human Resource - Bullying and Harassment</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-704
              </Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 001 */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Pre-trip & Post Trip Policy</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-001
              </Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Use of Company Vehicles</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-003U
              </Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Company Fuel Cards</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-002
              </Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Usage</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-003 GPS
              </Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FIRE EXTINGUISHER */}
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fire Extinguisher</Typography>
            </Stack>

            <Stack alignItems="center" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Chip
                label="HR MANAGER"
                size="small"
                variant="soft"
                color="error"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:close-circle-bold" />}
              />

              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                sx={{ minWidth: { xs: '120px', md: '100px' } }}
                onClick={async () => {}}
              >
                Sign Now
              </Button>
            </Stack>
          </Box>
        </Box>
      </>
    </>
  );
}
