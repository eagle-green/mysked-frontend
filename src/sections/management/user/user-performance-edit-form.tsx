import type { IUser } from 'src/types/user';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type NewUserSchemaType = zod.infer<typeof NewUserSchema>;

export const NewUserSchema = zod.object({
  punctuality: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  attitude: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  attendance: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  communication: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  teamwork: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  problem_solving: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  reliability: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
  quality_of_work: zod.union([zod.number(), zod.literal('not_rated')]).optional(),
});

// Enhanced performance rating options
const ENHANCED_PERFORMANCE_RATING_OPTIONS = [
  { value: 5, label: '5 - Excellent', description: 'Consistently exceeds expectations' },
  {
    value: 4,
    label: '4 - Very Good',
    description: 'Frequently meets and sometimes exceeds expectations',
  },
  { value: 3, label: '3 - Good', description: 'Meets expectations consistently' },
  { value: 2, label: '2 - Fair', description: 'Sometimes meets expectations, needs improvement' },
  {
    value: 1,
    label: '1 - Poor',
    description: 'Rarely meets expectations, significant improvement needed',
  },
  { value: 'not_rated', label: 'Not Rated', description: 'No rating provided yet' },
];

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUser;
};

export function UserPerformanceEditForm({ currentUser }: Props) {
  const router = useRouter();

  const defaultValues = {
    punctuality:
      (currentUser as any)?.performance?.punctuality ||
      'not_rated',
    attitude:
      (currentUser as any)?.performance?.attitude || 'not_rated',
    attendance:
      (currentUser as any)?.performance?.attendance ||
      'not_rated',
    communication:
      (currentUser as any)?.performance?.communication ||
      'not_rated',
    teamwork:
      (currentUser as any)?.performance?.teamwork || 'not_rated',
    problem_solving:
      (currentUser as any)?.performance?.problem_solving ||
      'not_rated',
    reliability:
      (currentUser as any)?.performance?.reliability ||
      'not_rated',
    quality_of_work:
      (currentUser as any)?.performance?.quality_of_work ||
      'not_rated',
  } as NewUserSchemaType;

  const methods = useForm<NewUserSchemaType>({
    mode: 'onChange',
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const toastId = toast.loading('Updating performance...');
    try {
      // Convert 'not_rated' to null for backend
      const performanceData = {
        punctuality: data.punctuality === 'not_rated' ? null : data.punctuality,
        attitude: data.attitude === 'not_rated' ? null : data.attitude,
        attendance: data.attendance === 'not_rated' ? null : data.attendance,
        communication: data.communication === 'not_rated' ? null : data.communication,
        teamwork: data.teamwork === 'not_rated' ? null : data.teamwork,
        problem_solving: data.problem_solving === 'not_rated' ? null : data.problem_solving,
        reliability: data.reliability === 'not_rated' ? null : data.reliability,
        quality_of_work: data.quality_of_work === 'not_rated' ? null : data.quality_of_work,
      };

      await fetcher([
        `${endpoints.user}/${currentUser?.id}`,
        {
          method: 'PUT',
          data: {
            performance: performanceData,
          },
        },
      ]);
      toast.dismiss(toastId);
      toast.success('Performance updated successfully!');
      router.push(paths.management.user.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Error updating performance:', error);
      toast.error('Failed to update performance. Please try again.');
    }
  });

  return (
    <Card>
      <Form methods={methods} onSubmit={onSubmit}>
        <Box
          sx={{
            p: 3,
            gap: 3,
            width: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Performance Evaluation
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Select
              name="punctuality"
              label="Punctuality"
              placeholder="Select rating"
              helperText="How well does the employee manage time and meet deadlines?"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="attitude"
              label="Attitude"
              placeholder="Select rating"
              helperText="Employee's work demeanor and approach to tasks"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="attendance"
              label="Attendance"
              placeholder="Select rating"
              helperText="Reliability and consistency in showing up for work"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="communication"
              label="Communication"
              placeholder="Select rating"
              helperText="Effectiveness in verbal and written communication"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="teamwork"
              label="Teamwork"
              placeholder="Select rating"
              helperText="Ability to work collaboratively with others"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="problem_solving"
              label="Problem Solving"
              placeholder="Select rating"
              helperText="Critical thinking and ability to resolve issues"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="reliability"
              label="Reliability"
              placeholder="Select rating"
              helperText="Consistency and dependability in completing tasks"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="quality_of_work"
              label="Quality of Work"
              placeholder="Select rating"
              helperText="Overall standard and excellence of work output"
            >
              {ENHANCED_PERFORMANCE_RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Field.Select>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 2 }}>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => router.push(paths.management.user.list)}
            >
              Cancel
            </Button>

            <Button color="inherit" variant="contained" type="submit" disabled={isSubmitting}>
              Update Performance
            </Button>
          </Box>
        </Box>
      </Form>
    </Card>
  );
}
