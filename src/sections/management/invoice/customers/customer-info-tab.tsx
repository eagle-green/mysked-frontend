import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

interface CustomerData {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  terms_name: string | null;
  qbo_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  customer: CustomerData;
}

export function CustomerInfoTab({ customer }: Props) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Customer Information
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1">{customer.name || '-'}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Company Name
          </Typography>
          <Typography variant="body1">{customer.company_name || '-'}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Phone Number
          </Typography>
          <Typography variant="body1">{customer.phone || '-'}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Email
          </Typography>
          {customer.email ? (
            <Box>
              {customer.email
                .split(',')
                .map((email) => email.trim())
                .filter((email) => email.length > 0)
                .map((email, index, array) => (
                  <Typography
                    key={index}
                    variant="body1"
                    sx={{ display: 'block', mb: index < array.length - 1 ? 0.5 : 0 }}
                  >
                    {email}
                  </Typography>
                ))}
            </Box>
          ) : (
            <Typography variant="body1">-</Typography>
          )}
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Address
          </Typography>
          <Typography variant="body1">{customer.address || '-'}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Terms
          </Typography>
          <Typography variant="body1">{customer.terms_name || '-'}</Typography>
        </Box>

        {customer.qbo_customer_id && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              QuickBooks Online ID
            </Typography>
            <Typography variant="body1">{customer.qbo_customer_id}</Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
