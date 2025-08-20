// Input validation utilities
export const validatePhoneNumber = (phone) => {
  // Remove all non-digits
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different input formats - remove +91 if present
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    cleanPhone = cleanPhone.slice(2); // Remove the '91' prefix
  }
  
  // Check if it's exactly 10 digits for Indian mobile numbers
  if (cleanPhone.length !== 10) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit mobile number'
    };
  }
  
  // Check if it's a valid Indian mobile number (starts with 6, 7, 8, or 9)
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid Indian mobile number'
    };
  }
  
  return {
    isValid: true,
    cleanPhone: cleanPhone, // ✅ CHANGED: Now returns only 10 digits for database
    displayPhone: `+91${cleanPhone}` // ✅ NEW: Formatted version for display
  };
};

export const validateFullName = (name) => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters long'
    };
  }
  
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: 'Name must be less than 50 characters'
    };
  }
  
  // Check for valid characters (letters, spaces, common symbols)
  const nameRegex = /^[a-zA-Z\s\.']+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Name can only contain letters, spaces, and basic punctuation'
    };
  }
  
  return {
    isValid: true,
    cleanName: trimmedName
  };
};

export const validateChantRounds = (rounds) => {
  // Convert to number
  const num = parseInt(rounds, 10);
  
  // Check if it's a valid positive integer
  if (isNaN(num) || num <= 0) {
    return {
      isValid: false,
      error: 'Please enter a positive number of rounds'
    };
  }
  
  // Reasonable upper limit (prevent accidental huge numbers)
  if (num > 1000) {
    return {
      isValid: false,
      error: 'Maximum 1000 rounds per submission'
    };
  }
  
  return {
    isValid: true,
    rounds: num
  };
};

export const formatPhoneDisplay = (phone) => {
  // Remove any non-digits first
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Handle both old format (+91xxxxxxxxxx) and new format (xxxxxxxxxx)
  let displayNumber;
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    displayNumber = cleanPhone.slice(2); // Remove 91 prefix
  } else if (cleanPhone.length === 10) {
    displayNumber = cleanPhone;
  } else {
    return phone; // Return as-is if format is unexpected
  }
  
  // Format as: +91 xxxxx xxxxx
  return `+91 ${displayNumber.slice(0, 5)} ${displayNumber.slice(5)}`;
};


export const getTimeFromNow = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};
