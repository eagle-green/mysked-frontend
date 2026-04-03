import React from 'react';
import { useRef, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { SignatureDialog } from './signature';

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if too large (max 1920px on longest side)
        const maxSize = 1920;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with 85% quality for good balance
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

export function NewEmployeePersonalInformation() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
    getValues,
  } = useFormContext();

  const [depositImages, setDepositImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const signatureDialog = useBoolean();

  const { employee, information_consent } = getValues();

  const equity = watch('equity_question');

  const payroll_deposit_letter = watch('payroll_deposit.payroll_deposit_letter');

  // Load existing letter data when component mounts or letter changes
  React.useEffect(() => {
    if (payroll_deposit_letter && typeof payroll_deposit_letter === 'string') {
      // Try to parse as JSON array first (new format with multiple URLs)
      if (payroll_deposit_letter.startsWith('[')) {
        try {
          const parsedImages = JSON.parse(payroll_deposit_letter);
          if (Array.isArray(parsedImages)) {
            // Check if array contains Cloudinary URLs or base64 data
            if (parsedImages.length > 0 && parsedImages[0].includes('cloudinary.com')) {
              // Array of Cloudinary URLs - convert all to base64
              const conversionPromises = parsedImages.map((url: string) =>
                fetch(url)
                  .then((response) => response.blob())
                  .then(
                    (blob) =>
                      new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                      })
                  )
              );

              Promise.all(conversionPromises)
                .then((base64Images) => {
                  setDepositImages(base64Images);
                  setValue('payroll_deposit.payroll_deposit_letter', JSON.stringify(base64Images));
                })
                .catch((error) => {
                  console.error('Error converting Cloudinary URLs to base64:', error);
                });
            } else {
              // Array of base64 images - use directly
              setDepositImages(parsedImages);
            }
          }
        } catch (error) {
          console.error('Error parsing existing diagram data:', error);
        }
      } else if (payroll_deposit_letter.includes('cloudinary.com')) {
        // Single Cloudinary URL (legacy format)
        fetch(payroll_deposit_letter)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              setDepositImages([base64]);
              setValue('payroll_deposit.payroll_deposit_letter', JSON.stringify([base64]));
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('Error converting Cloudinary URL to base64:', error);
          });
      }
    } else if (Array.isArray(payroll_deposit_letter)) {
      // Handle case where image is already an array
      setDepositImages(payroll_deposit_letter);
    }
  }, [payroll_deposit_letter, setValue]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            const compressed = await compressImage(file);
            newImages.push(compressed);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }

        // Update state with all successfully processed images
        const updatedImages = [...depositImages, ...newImages];
        setDepositImages(updatedImages);
        setValue('payroll_deposit.payroll_deposit_letter', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error in file upload:', error);
      }
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        const updatedImages = [...depositImages, compressed];
        setDepositImages(updatedImages);
        setValue('payroll_deposit.payroll_deposit_letter', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error processing camera file:', error);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = depositImages.filter((_, i) => i !== index);
    setDepositImages(updatedImages);
    // Store as JSON array string, or null if empty
    setValue(
      'payroll_deposit.payroll_deposit_letter',
      updatedImages.length > 0 ? JSON.stringify(updatedImages) : null
    );

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemoveAll = () => {
    setDepositImages([]);
    setValue('payroll_deposit.payroll_deposit_letter', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <>
      <>
        <Stack>
          <Typography variant="h4">Employee Personal Information</Typography>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Field.Text name="employee.last_name" label="Last Name*" />
          <Field.Text name="employee.first_name" label="First Name*" />
          <Field.Text name="employee.middle_initial" label="Initial*" />
          <Field.Text name="employee.sin" label="SIN*" />
          <Field.DatePicker
            name="employee.date_of_birth"
            label="Date of Birth"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: 1,
              px: 2,
            }}
          >
            <Typography variant="body2">Gender</Typography>
            <Controller
              control={control}
              name="employee.gender"
              render={({ field }) => (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    width: 1,
                  }}
                >
                  <Field.RadioGroup
                    {...field}
                    row
                    sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                    options={[
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' },
                      { label: 'Other', value: 'N/A' },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>
          <Field.Text name="employee.employee_number" label="Employee Number*" />
          <Field.Text name="employee.country" label="Country*" />
        </Box>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
          }}
        >
          <Field.Text name="employee.address" label="Address*" multiline rows={2} fullWidth />
        </Box>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Field.Text name="employee.city" label="Town/City*" />
          <Field.Text name="employee.province" label="Province*" />
          <Field.Text name="employee.postal_code" label="Postal Code*" />

          <Field.Text name="employee.home_phone_no" label="Home Phone#*" />
          <Field.Text name="employee.cell_no" label="Cellphone#*" />
          <Field.Text name="employee.email_address" label="Personal Email Address*" />
        </Box>

        <Field.Text
          name="employee.medical_allergies"
          label="Allergies / Medical Allerts"
          multiline
          rows={2}
          fullWidth
        />

        <Stack>
          <Typography variant="h4">Emergency Contact Information </Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Field.Text name="emergency_contact.last_name" label="Last Name*" />
          <Field.Text name="emergency_contact.first_name" label="First Name*" />
          <Field.Text name="emergency_contact.middle_initial" label="Middle Initial*" />

          <Field.Text name="emergency_contact.address" label="Address*" />
          <Field.Text name="emergency_contact.city" label="City/Province*" />
          <Field.Text name="emergency_contact.postal_code" label="Postal Code*" />

          <Field.Text name="emergency_contact.phone_no" label="Home Phone*" />
          <Field.Text name="emergency_contact.cell_no" label="Cell phone*" />
        </Box>

        <Stack>
          <Typography variant="h4">Employement Equity Question</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack>
          <Typography variant="body1" color="text.disabled">
            For the purpose of employment equity, please answer the following questions:
          </Typography>
        </Stack>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
          }}
        >
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1,
              width: 1,
            }}
          >
            <Typography variant="body1">ABORIGINAL PERSONS</Typography>
            <Typography variant="body2">
              Aboriginal peoples are those who identify as First Nations (Status, non-Status,
              Treaty), Metis, Inuit, or North American Indian. Do you consider yourself an
              Aboriginal person?
            </Typography>
            <Controller
              control={control}
              name="equity_question.is_visible_minority"
              render={({ field }) => (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    width: 1,
                  }}
                >
                  <Field.RadioGroup
                    {...field}
                    row
                    sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                    options={[
                      { label: 'Yes', value: 'yes' },
                      { label: 'No', value: 'no' },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
          }}
        >
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1,
              width: 1,
            }}
          >
            <Typography variant="body1">VISIBLE MINORITY</Typography>
            <Typography variant="body2">
              Members of visible minorities are persons in Canada (other than Aboriginal peoples)
              who are non white, regardless of place of birth or citizenship. Do you self-identify
              as a visible minority
            </Typography>
            <Controller
              control={control}
              name="equity_question.is_aboriginal_person"
              render={({ field }) => (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    width: 1,
                  }}
                >
                  <Field.RadioGroup
                    {...field}
                    row
                    sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                    options={[
                      { label: 'Yes', value: 'yes' },
                      { label: 'No', value: 'no' },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
          }}
        >
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1,
              width: 1,
            }}
          >
            <Typography variant="body1">OPTIONAL QUESTIONS</Typography>
            <Typography variant="body2">
              EG is dedicated to supporting social well-being in the communities in which we work.
              Would you be willing to participate in events that will help EG strengthen its
              commitment to diversity? If you choose to participate in certain events, Employee
              Services may ask you to attend and help. Your participation is voluntary ?
            </Typography>
            <Typography variant="body2">
              Some projects require members/ employees from a specific aboriginal nation to work on
              the project. Would you be interested in being considered for these opportunities?
            </Typography>
            <Controller
              control={control}
              name="equity_question.is_participation_voluntary"
              render={({ field }) => (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    width: 1,
                  }}
                >
                  <Field.RadioGroup
                    {...field}
                    row
                    sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                    options={[
                      { label: 'Yes', value: 'yes' },
                      { label: 'No', value: 'no' },
                    ]}
                  />
                </Box>
              )}
            />
            <Typography variant="body2">If yes, please tell us your Nation?</Typography>
          </Stack>
        </Box>

        {equity.is_participation_voluntary && equity.is_participation_voluntary == 'yes' && (
          <Field.Text
            name="equity_question.participation_voluntary_text"
            label="Please enter country"
          />
        )}

        <Stack>
          <Typography variant="h4">Payroll Direct Deposit</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Card
          sx={{
            p: 2,
            mb: 3,
            bgcolor: errors.payroll_deposit ? 'error.lighter' : 'primary.lighter',
            borderLeft: 5,
            borderColor: errors.payroll_deposit ? 'error.dark' : 'primary.dark',
          }}
        >
          <Typography
            variant="body2"
            color={errors.payroll_deposit ? 'error.dark' : 'primary.dark'}
          >
            You must provide at least account number or upload your bank letter in order for your
            payroll to be processed.
          </Typography>
        </Card>

        <Field.Text name="payroll_deposit.account_number" label="Account Number*" />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:camera-add-bold" />}
              onClick={() => cameraInputRef.current?.click()}
              sx={{
                minWidth: { xs: '100%', md: 200 },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              Take Photo
            </Button>

            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:import-bold" />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                minWidth: { xs: '100%', md: 200 },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              Upload Images
            </Button>

            {depositImages.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={handleRemoveAll}
                sx={{ minWidth: 200 }}
              >
                Remove All ({depositImages.length})
              </Button>
            )}
          </Box>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
          />

          {/* Images preview in grid */}
          {depositImages.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Payroll Deposit ({depositImages.length}):
              </Typography>
              <Grid container spacing={2}>
                {depositImages.map((image, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Box
                      sx={{
                        position: 'relative',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={image}
                        alt={`FLRA Diagram ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'contain',
                          borderRadius: 1,
                          bgcolor: 'background.neutral',
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Image {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(index)}
                          sx={{ ml: 'auto' }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {depositImages.length === 0 && (
            <Box
              sx={{
                border: 2,
                borderColor: 'divider',
                borderStyle: 'dashed',
                borderRadius: 1,
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Iconify
                icon="solar:gallery-add-bold"
                width={48}
                height={48}
                sx={{ mb: 2, opacity: 0.5 }}
              />
              <Typography variant="body2">
                PLEASE ATTACH A VOID CHEQUE OR A DIRECT DEPOSIT LETTER FROM YOUR BANK
              </Typography>
            </Box>
          )}
        </Box>

        <Stack>
          <Box
            sx={{
              bgcolor: 'divider',
              py: 2,
              px: 1,
              borderRadius: 1,
            }}
          >
            <Controller
              name="information_consent"
              control={control}
              render={({ field }) => (
                <Field.Checkbox
                  name="information_consent"
                  label="I confirm that all the information I have provided is accurate and complete. I authorize Eagle Green (EG) to use my personal information, including my signature and images, on its website, newsletters, social media, and other official materials"
                  slotProps={{
                    checkbox: {
                      onChange: async (e, checked) => {
                        field.onChange(checked);
                        setTimeout(async () => {
                          const isValid = await trigger('information_consent');
                          if (isValid) {
                            clearErrors('information_consent');
                          }
                        }, 50);
                      },
                    },
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    flexDirection: 'row',
                    gap: 1,
                  }}
                />
              )}
            />
          </Box>

          {errors?.information_consent && (
            <FormHelperText error sx={{ ml: 0, pl: 1 }}>
              Required to acknowledged before proceeding
            </FormHelperText>
          )}
        </Stack>

        {!employee.signature && (
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr', sm: 'repeat(3, 1fr' },
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                signatureDialog.onTrue();
              }}
              disabled={!information_consent}
              fullWidth
              startIcon={
                employee.signature ? (
                  <Iconify icon="solar:check-circle-bold" color="success.main" />
                ) : (
                  <Iconify icon="solar:pen-bold" />
                )
              }
              sx={{
                display: { xs: 'flex', sm: 'inline-flex' },
                width: { xs: '100%', sm: 'auto' },
                py: { xs: 1.5, sm: 0.875 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
              }}
            >
              Add Signature
            </Button>
            {errors?.employee && (
              <FormHelperText error sx={{ ml: 0, pl: 1 }}>
                Signature required
              </FormHelperText>
            )}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 5,
            mt: 2,
          }}
        >
          {employee.signature && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: { xs: 'center', md: 'flex-end' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 5,
                width: '100%',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box>
                  <img src={employee.signature} alt="Employee Signature" />
                </Box>
                <Typography variant="subtitle1">
                  EMPLOYEE’S SIGNATURE
                  <IconButton
                    onClick={() => {
                      signatureDialog.onTrue();
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  (Signature Over Printed Name)
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1">09/20/2023</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  (Date Signed)
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Signature Dialog for Initial */}
        <SignatureDialog
          title="Employee Signature"
          type="employee"
          dialog={signatureDialog}
          onSave={(signature, type) => {
            if (signature) {
              if (signature) {
                setValue('employee.signature', signature);
              }
            }
          }}
          onCancel={() => {}}
        />
      </>

      {/* <EmployeeContractDetailForm /> */}
    </>
  );
}
