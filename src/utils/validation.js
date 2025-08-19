// Input validation utilities
export const validatePhoneNumber = (phone) => {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
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
    cleanPhone: `+91${cleanPhone}` // CHANGED: Now returns +91 prefix
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
  // Format phone number for display (e.g., +91 98765 43210)
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
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
