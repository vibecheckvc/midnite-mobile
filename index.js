import { registerRootComponent } from 'expo';

import App from './App';

// Global error handler to prevent crashes from unhandled exceptions
// Only set up if ErrorUtils is available
try {
  const { ErrorUtils } = require('react-native');
  
  if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function') {
    const originalHandler = ErrorUtils.getGlobalHandler();

    if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('🚨 Global Error Handler:', error);
        console.error('🚨 Is Fatal:', isFatal);
        console.error('🚨 Stack:', error?.stack);
        
        // Log the error but don't crash
        // In production, you might want to send this to a crash reporting service
        if (isFatal) {
          // Try to prevent the crash by logging and continuing
          console.error('⚠️ Fatal error caught - attempting to prevent crash');
        }
        
        // Call original handler as fallback, but wrap it to prevent crashes
        try {
          if (originalHandler) {
            originalHandler(error, false); // Set isFatal to false to prevent crash
          }
        } catch (e) {
          console.error('Error in global error handler:', e);
        }
      });
    }
  }
} catch (error) {
  // ErrorUtils not available - that's okay, continue without it
  console.warn('⚠️ ErrorUtils not available, skipping global error handler setup');
}

// Handle unhandled promise rejections
if (typeof global !== 'undefined' && global.Promise) {
  try {
    const originalRejectionHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event?.reason);
      console.error('🚨 Promise Rejection Stack:', event?.reason?.stack);
      // Prevent default crash behavior
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (originalRejectionHandler) {
        originalRejectionHandler(event);
      }
    };
  } catch (error) {
    // Promise rejection handler setup failed - continue anyway
    console.warn('⚠️ Could not set up promise rejection handler');
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
