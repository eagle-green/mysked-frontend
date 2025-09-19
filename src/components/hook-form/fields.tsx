import { RHFSwitch } from './rhf-switch';
import { RHFSelect } from './rhf-select';
import { RHFCheckbox } from './rhf-checkbox';
import { RHFUploadAvatar } from './rhf-upload';
import { RHFTextField } from './rhf-text-field';
import { RHFPhoneInput } from './rhf-phone-input';
import { RHFRadioGroup } from './rhf-radio-group';
import { RHFAutocomplete } from './rhf-autocomplete';
import { RHFCountrySelect } from './rhf-country-select';
import { RHFAutocompleteWithAvatar } from './rhf-autocomplete-with-avatar';
import { RHFAutocompleteWithLicenseStatus } from './rhf-autocomplete-with-license-status';
import { RHFDatePicker, RHFTimePicker, RHFDateTimePicker, RHFMobileDateTimePicker } from './rhf-date-picker';
// ----------------------------------------------------------------------

export const Field = {
  Select: RHFSelect,
  Text: RHFTextField,
  Switch: RHFSwitch,
  Phone: RHFPhoneInput,
  CountrySelect: RHFCountrySelect,
  MobileDateTimePicker: RHFMobileDateTimePicker,
  UploadAvatar: RHFUploadAvatar,
  Autocomplete: RHFAutocomplete,
  AutocompleteWithAvatar: RHFAutocompleteWithAvatar,
  AutocompleteWithLicenseStatus: RHFAutocompleteWithLicenseStatus,
  DatePicker: RHFDatePicker,
  TimePicker: RHFTimePicker,
  DateTimePicker: RHFDateTimePicker,
  Checkbox: RHFCheckbox,
  RadioGroup: RHFRadioGroup,
};
