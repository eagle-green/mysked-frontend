import { RHFSwitch } from './rhf-switch';
import { RHFSelect } from './rhf-select';
import { RHFUploadAvatar } from './rhf-upload';
import { RHFTextField } from './rhf-text-field';
import { RHFPhoneInput } from './rhf-phone-input';
import { RHFCountrySelect } from './rhf-country-select';
import { RHFMobileDateTimePicker } from './rhf-date-picker';

// ----------------------------------------------------------------------

export const Field = {
  Select: RHFSelect,
  Text: RHFTextField,
  Switch: RHFSwitch,
  Phone: RHFPhoneInput,
  CountrySelect: RHFCountrySelect,
  MobileDateTimePicker: RHFMobileDateTimePicker,
  UploadAvatar: RHFUploadAvatar,
};
