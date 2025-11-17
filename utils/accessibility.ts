/**
 * Accessibility utilities for better user experience
 */

/**
 * Generate ARIA labels for common actions
 */
export const ariaLabels = {
  addGame: 'Add game to collection',
  removeGame: 'Remove game from collection',
  editGame: 'Edit game details',
  viewGame: 'View game details',
  rateGame: 'Rate this game',
  toggleFavorite: 'Toggle favorite status',
  searchGames: 'Search for games',
  filterGames: 'Filter games',
  sortGames: 'Sort games',
  loadMore: 'Load more games',
  closeModal: 'Close modal',
  saveChanges: 'Save changes',
  cancelEdit: 'Cancel editing',
  deleteItem: 'Delete item',
  confirmAction: 'Confirm action',
  signIn: 'Sign in to your account',
  signUp: 'Create new account',
  signOut: 'Sign out of your account',
  connectSteam: 'Connect Steam account',
  disconnectSteam: 'Disconnect Steam account',
  syncLibrary: 'Sync game library',
  refreshData: 'Refresh data',
  toggleMenu: 'Toggle navigation menu',
  toggleTheme: 'Toggle dark/light theme',
  toggleNotifications: 'Toggle notifications',
  goToProfile: 'Go to profile page',
  goToLibrary: 'Go to game library',
  goToDashboard: 'Go to dashboard',
  goToSettings: 'Go to settings',
  goBack: 'Go back',
  goForward: 'Go forward',
  openInNewTab: 'Open in new tab',
  downloadFile: 'Download file',
  shareContent: 'Share content',
  copyLink: 'Copy link to clipboard',
  printPage: 'Print page',
  help: 'Get help',
  feedback: 'Send feedback',
  reportIssue: 'Report an issue'
};

/**
 * Generate ARIA descriptions for complex elements
 */
export const ariaDescriptions = {
  gameCard: (gameTitle: string, status: string, rating: number) => 
    `${gameTitle}, status: ${status}, rating: ${rating} stars`,
  gameStats: (totalGames: number, playing: number, finished: number) =>
    `Total games: ${totalGames}, currently playing: ${playing}, finished: ${finished}`,
  progressBar: (current: number, total: number) =>
    `Progress: ${current} of ${total} completed`,
  ratingStars: (rating: number, maxRating: number = 5) =>
    `Rating: ${rating} out of ${maxRating} stars`,
  searchResults: (count: number, query: string) =>
    `${count} results found for "${query}"`,
  filterOptions: (activeFilters: string[]) =>
    `Active filters: ${activeFilters.join(', ')}`,
  pagination: (currentPage: number, totalPages: number) =>
    `Page ${currentPage} of ${totalPages}`,
  loadingState: (item: string) =>
    `Loading ${item}, please wait`,
  errorState: (error: string) =>
    `Error: ${error}`,
  successState: (action: string) =>
    `${action} completed successfully`
};

/**
 * Generate keyboard navigation instructions
 */
export const keyboardInstructions = {
  gameCard: 'Press Enter to view details, Space to toggle favorite',
  gameList: 'Use arrow keys to navigate, Enter to select',
  searchBox: 'Type to search, Enter to submit, Escape to clear',
  filterMenu: 'Use arrow keys to navigate options, Enter to select',
  modal: 'Press Escape to close, Tab to navigate elements',
  form: 'Use Tab to navigate fields, Enter to submit',
  navigation: 'Use Tab to navigate links, Enter to activate',
  rating: 'Use arrow keys to change rating, Enter to confirm',
  dropdown: 'Use arrow keys to navigate, Enter to select, Escape to close'
};

/**
 * Generate focus management utilities
 */
export const focusManagement = {
  /**
   * Focus the first focusable element in a container
   */
  focusFirst: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  },

  /**
   * Focus the last focusable element in a container
   */
  focusLast: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  },

  /**
   * Trap focus within a container (for modals)
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
};

/**
 * Generate screen reader announcements
 */
export const screenReaderAnnouncements = {
  gameAdded: (gameTitle: string) => `${gameTitle} added to your collection`,
  gameRemoved: (gameTitle: string) => `${gameTitle} removed from your collection`,
  gameUpdated: (gameTitle: string) => `${gameTitle} updated successfully`,
  gameDeleted: (gameTitle: string) => `${gameTitle} deleted`,
  profileUpdated: 'Profile updated successfully',
  settingsSaved: 'Settings saved successfully',
  dataLoaded: 'Data loaded successfully',
  dataSaved: 'Data saved successfully',
  errorOccurred: (error: string) => `Error: ${error}`,
  loadingStarted: (item: string) => `Loading ${item}...`,
  loadingCompleted: (item: string) => `${item} loaded successfully`,
  searchCompleted: (count: number) => `Search completed, ${count} results found`,
  filterApplied: (filter: string) => `Filter applied: ${filter}`,
  filterRemoved: (filter: string) => `Filter removed: ${filter}`,
  sortApplied: (sortBy: string) => `Sorted by ${sortBy}`,
  pageChanged: (page: number) => `Page changed to ${page}`,
  modalOpened: (title: string) => `${title} modal opened`,
  modalClosed: (title: string) => `${title} modal closed`,
  tabChanged: (tabName: string) => `Switched to ${tabName} tab`,
  connectionEstablished: 'Connection established',
  connectionLost: 'Connection lost',
  syncStarted: 'Sync started',
  syncCompleted: 'Sync completed',
  syncFailed: 'Sync failed'
};

/**
 * Generate semantic HTML attributes
 */
export const semanticAttributes = {
  gameCard: (game: any) => ({
    role: 'article',
    'aria-label': ariaLabels.viewGame,
    'aria-describedby': `game-${game.id}-description`,
    tabIndex: 0
  }),
  
  gameList: () => ({
    role: 'list',
    'aria-label': 'Game collection',
    'aria-live': 'polite'
  }),
  
  searchBox: () => ({
    role: 'searchbox',
    'aria-label': ariaLabels.searchGames,
    'aria-describedby': 'search-instructions',
    'aria-expanded': 'false'
  }),
  
  filterMenu: (isOpen: boolean) => ({
    role: 'menu',
    'aria-label': 'Filter options',
    'aria-expanded': isOpen.toString(),
    'aria-haspopup': 'true'
  }),
  
  rating: (rating: number, maxRating: number = 5) => ({
    role: 'slider',
    'aria-label': ariaDescriptions.ratingStars(rating, maxRating),
    'aria-valuemin': 1,
    'aria-valuemax': maxRating,
    'aria-valuenow': rating,
    'aria-valuetext': `${rating} out of ${maxRating} stars`
  }),
  
  progressBar: (current: number, total: number) => ({
    role: 'progressbar',
    'aria-label': ariaDescriptions.progressBar(current, total),
    'aria-valuemin': 0,
    'aria-valuemax': total,
    'aria-valuenow': current,
    'aria-valuetext': `${current} of ${total} completed`
  }),
  
  modal: (title: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-title',
    'aria-describedby': 'modal-description'
  }),
  
  button: (action: string, disabled: boolean = false) => ({
    role: 'button',
    'aria-label': ariaLabels[action as keyof typeof ariaLabels] || action,
    'aria-disabled': disabled.toString(),
    tabIndex: disabled ? -1 : 0
  })
};

/**
 * Generate color contrast utilities
 */
export const colorContrast = {
  /**
   * Check if color combination meets WCAG AA standards
   */
  meetsAA: (foreground: string, background: string): boolean => {
    // This is a simplified check - in production, use a proper color contrast library
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    return contrast >= 4.5;
  },
  
  /**
   * Get high contrast version of a color
   */
  getHighContrast: (color: string): string => {
    // Simplified implementation - use proper color manipulation library in production
    return color === '#000000' ? '#ffffff' : '#000000';
  }
};

/**
 * Helper function to get luminance (simplified)
 */
function getLuminance(color: string): number {
  // Simplified luminance calculation
  // In production, use a proper color manipulation library
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
