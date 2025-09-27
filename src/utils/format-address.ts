/**
 * Utility functions for formatting addresses consistently across mobile components
 * Supports international address formats with smart parsing
 */

// ----------------------------------------------------------------------

/**
 * Formats address for mobile display with smart splitting rules:
 * - Street number + street name on first line 
 * - City, State/Province, Postal Code on second line
 * 
 * Automatically handles various address formats:
 * - Canadian: "123 Main Street, Vancouver, BC, V6B 1A1"
 * - US: "123 Main Street, New York, NY, 10001"
 * - UK: "123 Main Street, London, SW1A 1AA"
 * - General: Street info first, then city/province/postal
 * 
 * Example:
 * Input: "919, 292, Sterret, Vancouver, BC, B1T 2G2"
 * Output: ["919, 292 Sterret,", "Vancouver, BC, B1T 2G2"]
 */
export function formatAddressForMobile(address: string): { firstLine: string; secondLine: string } | null {
  if (!address || address.trim() === '') {
    return null;
  }

  try {
    // Split by comma and clean up whitespace
    const parts = address.split(',').map((part: string) => part.trim()).filter(Boolean);
    
    if (parts.length < 2) {
      return { firstLine: address, secondLine: '' };
    }

    // Enhanced pattern matching to identify city/destination boundary
    const locationPatterns = [
      // Common US states
      /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/,
      // Canadian provinces and territories (postal codes)
      /\b[ABCEGHJKLMNPRSTVXY]\d[A-Z]\d[A-Z]\d[a-z]\d\b|\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/i,
      // UK patterns
      /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/,
      // International patterns - zones with postal codes
      /\b\d{5}(-\d{4})?\b/, // US ZIP codes
      /\b[A-Z0-9\s-]{3,}\s\d{4,8}\b/, // Extended postal patterns
    ];

    // Also check for city-like patterns (title case words that could be cities)
    const cityLikePatterns = [
      /\b[A-Z][a-z]{2,}\b\s*[A-Z][a-z]{2,}\b/, // Title Case Cities like "New York"
      /\b[A-Z][a-z]{4,}\b/, // Single title case words likely city names
    ];

    let splitIndex = -1;

    // Method 1: Look for location patterns (states, provinces, postal codes)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Check against location patterns
      if (locationPatterns.some(pattern => pattern.test(part))) {
        splitIndex = i;
        break;
      }
    }

    // Method 2: If no location patterns found, look for city-like patterns
    if (splitIndex === -1) {
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        
        if (cityLikePatterns.some(pattern => pattern.test(part)) && 
            !part.match(/^\d/) && // Not a number
            !part.match(/Street|Avenue|Road|Drive|Lane|Boulevard|Way|Place|Circle/i)) {
          splitIndex = i;
          break;
        }
      }
    }

    // Method 3: Smart fallback based on common address structures
    if (splitIndex === -1) {
      const likelySplitPoints = [
        Math.ceil(parts.length / 2), // Middle split
        2, // After first 2 parts (street number + street name)
        parts.length - 2, // 2 parts before the end (often city/state)
      ];

      for (const splitPoint of likelySplitPoints) {
        if (splitPoint > 0 && splitPoint < parts.length) {
          const potentialCityPart = parts[splitPoint];
          // Check if this could be a location identifier
          if (!potentialCityPart.match(/^\d+/) && 
              potentialCityPart.length > 2 && 
              /[A-Za-z]/.test(potentialCityPart)) {
            splitIndex = splitPoint;
            break;
          }
        }
      }
    }

    // Apply the split if we found a good one
    if (splitIndex > 0 && splitIndex < parts.length) {
      const streetParts = parts.slice(0, splitIndex);
      const locationParts = parts.slice(splitIndex);
      
      // Street line: ensure it ends with comma and looks proper
      let firstLine = streetParts.join(', ');
      if (!firstLine.endsWith(',')) {
        // Add comma if the last part is likely a street name
        const lastPart = streetParts[streetParts.length - 1] || '';
        if (/[A-Za-z]/.test(lastPart) && !lastPart.match(/^\d+$/)) {
          firstLine += ',';
        }
      }
      
      // Location line: clean up and format properly
      const secondLine = locationParts
        .filter((part: string) => 
          // Filter out generic country names that clutter the display
           !['Canada', 'United States', 'USA', 'UK', 'England'].includes(part)
        )
        .join(', ')
        .replace(/\bBritish Columbia\b/gi, 'BC')
        .replace(/\bBritish Columbia BC\b/gi, 'BC')
        .trim();

      return { firstLine, secondLine };
    }

    // Method 4: Conservative fallback
    if (parts.length >= 3) {
      const splitPoint = Math.min(2, parts.length - 1);
      return {
        firstLine: parts.slice(0, splitPoint).join(', ') + (parts[splitPoint - 1]?.match(/[A-Za-z]/) ? ',' : ''),
        secondLine: parts.slice(splitPoint).join(', ')
      };
    }
    
    // Final fallback - just split evenly or show on one line
    return {
      firstLine: parts.length <= 2 ? address : parts[0] + ',',
      secondLine: parts.length <= 2 ? '' : parts.slice(1).join(', ')
    };

  } catch (error) {
    console.warn('Error formatting address:', error);
    return { firstLine: address, secondLine: '' };
  }
}

/**
 * Renders formatted address as Typography components ready for mobile display
 */
export function renderFormattedAddress(
  address: string,
  typographyProps: any = { variant: 'caption', color: 'text.secondary' }
) {
  const formatted = formatAddressForMobile(address);
  
  if (!formatted) {
    return null;
  }

  return {
    firstLine: formatted.firstLine,
    secondLine: formatted.secondLine,
    isValid: formatted.firstLine !== '' || formatted.secondLine !== ''
  };
}
