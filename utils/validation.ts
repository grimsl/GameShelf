// Define GameStatus locally to avoid import issues
type GameStatus = 'playing' | 'finished' | 'paused' | 'dropped' | 'planning';

/**
 * Validation schemas and utilities
 */

export const validationRules = {
  userHandle: {
    required: 'Username is required',
    minLength: (min: number) => `Username must be at least ${min} characters`,
    maxLength: (max: number) => `Username must be no more than ${max} characters`,
    pattern: 'Username can only contain letters, numbers, and underscores'
  },
  email: {
    required: 'Email is required',
    pattern: 'Please enter a valid email address'
  },
  password: {
    required: 'Password is required',
    minLength: (min: number) => `Password must be at least ${min} characters`,
    pattern: 'Password must contain at least one letter and one number'
  },
  gameTitle: {
    required: 'Game title is required',
    minLength: (min: number) => `Title must be at least ${min} characters`,
    maxLength: (max: number) => `Title must be no more than ${max} characters`
  },
  rating: {
    required: 'Rating is required',
    min: 'Rating must be at least 1',
    max: 'Rating must be no more than 5'
  },
  notes: {
    maxLength: (max: number) => `Notes must be no more than ${max} characters`
  }
};

/**
 * Validate user handle
 */
export const validateUserHandle = (userHandle: string): string | null => {
  if (!userHandle.trim()) {
    return validationRules.userHandle.required;
  }
  
  if (userHandle.length < 3) {
    return validationRules.userHandle.minLength(3);
  }
  
  if (userHandle.length > 20) {
    return validationRules.userHandle.maxLength(20);
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(userHandle)) {
    return validationRules.userHandle.pattern;
  }
  
  return null;
};

/**
 * Validate email
 */
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return validationRules.email.required;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return validationRules.email.pattern;
  }
  
  return null;
};

/**
 * Validate password
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return validationRules.password.required;
  }
  
  if (password.length < 6) {
    return validationRules.password.minLength(6);
  }
  
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return validationRules.password.pattern;
  }
  
  return null;
};

/**
 * Validate game title
 */
export const validateGameTitle = (title: string): string | null => {
  if (!title.trim()) {
    return validationRules.gameTitle.required;
  }
  
  if (title.length < 1) {
    return validationRules.gameTitle.minLength(1);
  }
  
  if (title.length > 100) {
    return validationRules.gameTitle.maxLength(100);
  }
  
  return null;
};

/**
 * Validate rating
 */
export const validateRating = (rating: number): string | null => {
  if (rating < 1) {
    return validationRules.rating.min;
  }
  
  if (rating > 5) {
    return validationRules.rating.max;
  }
  
  return null;
};

/**
 * Validate notes
 */
export const validateNotes = (notes: string): string | null => {
  if (notes.length > 1000) {
    return validationRules.notes.maxLength(1000);
  }
  
  return null;
};

/**
 * Validate game status
 */
export const validateGameStatus = (status: string): string | null => {
  const validStatuses: GameStatus[] = ['playing', 'finished', 'paused', 'dropped', 'planning'];
  
  if (!validStatuses.includes(status as GameStatus)) {
    return 'Invalid game status';
  }
  
  return null;
};

/**
 * Validate Steam ID
 */
export const validateSteamId = (steamId: string): string | null => {
  if (!steamId.trim()) {
    return 'Steam ID is required';
  }
  
  // Steam ID should be numeric and 17 digits
  if (!/^\d{17}$/.test(steamId)) {
    return 'Steam ID must be 17 digits';
  }
  
  return null;
};

/**
 * Validate Steam profile URL
 */
export const validateSteamProfileUrl = (url: string): string | null => {
  if (!url.trim()) {
    return 'Steam profile URL is required';
  }
  
  const steamUrlRegex = /^https:\/\/steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/;
  if (!steamUrlRegex.test(url)) {
    return 'Please enter a valid Steam profile URL';
  }
  
  return null;
};

/**
 * Extract Steam ID from profile URL
 */
export const extractSteamIdFromUrl = (url: string): string | null => {
  const match = url.match(/steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const [, type, identifier] = match;
    if (type === 'profiles' && /^\d{17}$/.test(identifier)) {
      return identifier;
    }
    // For custom URLs, we'd need to resolve them to get the actual Steam ID
    // This would require an API call in a real implementation
    return null;
  }
  return null;
};

/**
 * Validate form data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => string | null>): ValidationResult => {
  const errors: Record<string, string> = {};
  
  for (const [field, value] of Object.entries(data)) {
    if (rules[field]) {
      const error = rules[field](value);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim();
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File, maxSizeMB: number = 5): string | null => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'File must be an image (JPEG, PNG, GIF, or WebP)';
  }
  
  return null;
};
