// Input validation utilities
export const validatePhoneNumber = (phone) => {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10 digits for most countries)
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (10-15 digits)'
    };
  }
  
  return {
    isValid: true,
    cleanPhone
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
