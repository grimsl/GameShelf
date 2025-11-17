import toast from 'react-hot-toast';

// Define AppError interface locally to avoid import issues
interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class ErrorHandler {
  /**
   * Handle API errors with consistent user feedback
   */
  static handleApiError(error: unknown, fallbackMessage: string = 'An error occurred'): AppError {
    console.error('API Error:', error);
    
    let errorMessage = fallbackMessage;
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = error.name || 'ERROR';
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorCode = 'STRING_ERROR';
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as any).message;
      errorCode = (error as any).code || 'OBJECT_ERROR';
    }
    
    const appError: AppError = {
      code: errorCode,
      message: errorMessage,
      details: error
    };
    
    // Show user-friendly error message
    toast.error(this.getUserFriendlyMessage(errorMessage));
    
    return appError;
  }
  
  /**
   * Handle Steam API specific errors
   */
  static handleSteamApiError(error: unknown, context: string = 'Steam API'): AppError {
    console.error(`${context} Error:`, error);
    
    let errorMessage = 'Steam API error occurred';
    let errorCode = 'STEAM_API_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('private')) {
        errorMessage = 'Steam profile is private. Please set your profile to public.';
        errorCode = 'STEAM_PROFILE_PRIVATE';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Steam profile not found. Please check your Steam ID.';
        errorCode = 'STEAM_PROFILE_NOT_FOUND';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Steam API rate limit exceeded. Please try again later.';
        errorCode = 'STEAM_RATE_LIMIT';
      } else {
        errorMessage = error.message;
        errorCode = 'STEAM_API_ERROR';
      }
    }
    
    const appError: AppError = {
      code: errorCode,
      message: errorMessage,
      details: error
    };
    
    toast.error(errorMessage);
    return appError;
  }
  
  /**
   * Handle authentication errors
   */
  static handleAuthError(error: unknown, context: string = 'Authentication'): AppError {
    console.error(`${context} Error:`, error);
    
    let errorMessage = 'Authentication error occurred';
    let errorCode = 'AUTH_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('invalid credentials')) {
        errorMessage = 'Invalid email or password';
        errorCode = 'INVALID_CREDENTIALS';
      } else if (error.message.includes('user not found')) {
        errorMessage = 'User not found';
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message.includes('email already exists')) {
        errorMessage = 'Email already registered';
        errorCode = 'EMAIL_EXISTS';
      } else {
        errorMessage = error.message;
        errorCode = 'AUTH_ERROR';
      }
    }
    
    const appError: AppError = {
      code: errorCode,
      message: errorMessage,
      details: error
    };
    
    toast.error(errorMessage);
    return appError;
  }
  
  /**
   * Handle validation errors
   */
  static handleValidationError(error: unknown, field?: string): AppError {
    console.error('Validation Error:', error);
    
    let errorMessage = 'Validation error occurred';
    let errorCode = 'VALIDATION_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = 'VALIDATION_ERROR';
    }
    
    const appError: AppError = {
      code: errorCode,
      message: errorMessage,
      details: error
    };
    
    if (field) {
      toast.error(`${field}: ${errorMessage}`);
    } else {
      toast.error(errorMessage);
    }
    
    return appError;
  }
  
  /**
   * Handle network errors
   */
  static handleNetworkError(error: unknown): AppError {
    console.error('Network Error:', error);
    
    let errorMessage = 'Network error occurred';
    let errorCode = 'NETWORK_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to server. Please check your internet connection.';
        errorCode = 'NETWORK_FETCH_ERROR';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        errorCode = 'NETWORK_TIMEOUT';
      } else {
        errorMessage = error.message;
        errorCode = 'NETWORK_ERROR';
      }
    }
    
    const appError: AppError = {
      code: errorCode,
      message: errorMessage,
      details: error
    };
    
    toast.error(errorMessage);
    return appError;
  }
  
  /**
   * Get user-friendly error messages
   */
  private static getUserFriendlyMessage(errorMessage: string): string {
    const friendlyMessages: Record<string, string> = {
      'Network Error': 'Please check your internet connection',
      'Failed to fetch': 'Unable to connect to the server',
      'Unauthorized': 'Please sign in to continue',
      'Forbidden': 'You don\'t have permission to perform this action',
      'Not Found': 'The requested resource was not found',
      'Internal Server Error': 'Something went wrong on our end',
      'Service Unavailable': 'The service is temporarily unavailable'
    };
    
    for (const [key, friendlyMessage] of Object.entries(friendlyMessages)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return friendlyMessage;
      }
    }
    
    return errorMessage;
  }
  
  /**
   * Log error for debugging
   */
  static logError(error: AppError, context?: string): void {
    const logMessage = context 
      ? `[${context}] ${error.code}: ${error.message}`
      : `${error.code}: ${error.message}`;
    
    console.error(logMessage, error.details);
  }
  
  /**
   * Handle errors silently (no toast)
   */
  static handleSilentError(error: unknown): AppError {
    console.error('Silent Error:', error);
    
    let errorMessage = 'An error occurred';
    let errorCode = 'SILENT_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = error.name || 'SILENT_ERROR';
    }
    
    return {
      code: errorCode,
      message: errorMessage,
      details: error
    };
  }
}
