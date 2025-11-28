import { useState, useEffect } from 'react';

/**
 * Custom hook for PWA install functionality
 * Handles the beforeinstallprompt event and provides install capabilities
 */
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (event) => {
      console.log('PWA: beforeinstallprompt event fired');
      
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Track install event (optional analytics)
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'PWA Install'
        });
      }
    };

    // Handle installation choice
    const handleInstallChoice = (event) => {
      console.log('PWA: User choice:', event.outcome);
      
      if (event.outcome === 'accepted') {
        setIsInstalling(true);
      } else {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Function to trigger the install prompt
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('PWA: No deferred prompt available');
      return false;
    }

    try {
      setIsInstalling(true);
      
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA: User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        setIsInstalled(true);
        setIsInstallable(false);
      } else {
        console.log('PWA: User dismissed the install prompt');
        setIsInstallable(false);
      }
      
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setIsInstalling(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Error during install prompt:', error);
      setIsInstalling(false);
      return false;
    }
  };

  // Function to check if PWA features are supported
  const isPWASupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  // Function to check if running in standalone mode
  const isRunningStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  };

  // Function to get install instructions based on browser
  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return {
        browser: 'Safari on iOS',
        instructions: [
          'Tap the share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install Urban.IQ'
        ]
      };
    } else if (/Android/.test(userAgent) && /Chrome/.test(userAgent)) {
      return {
        browser: 'Chrome on Android',
        instructions: [
          'Tap the menu button (⋮)',
          'Tap "Add to Home screen"',
          'Tap "Add" to install Urban.IQ'
        ]
      };
    } else if (/Edge/.test(userAgent)) {
      return {
        browser: 'Microsoft Edge',
        instructions: [
          'Click the "..." menu',
          'Click "Apps" > "Install this site as an app"',
          'Click "Install" to add Urban.IQ'
        ]
      };
    } else if (/Chrome/.test(userAgent)) {
      return {
        browser: 'Chrome',
        instructions: [
          'Click the install button in the address bar',
          'Or click the menu (⋮) > "Install Urban.IQ"',
          'Click "Install" to add to your computer'
        ]
      };
    } else {
      return {
        browser: 'Your browser',
        instructions: [
          'Look for an "Install" or "Add to Home Screen" option',
          'Check your browser\'s menu for app installation',
          'Follow the prompts to install Urban.IQ'
        ]
      };
    }
  };

  return {
    isInstallable,
    isInstalled,
    isInstalling,
    promptInstall,
    isPWASupported: isPWASupported(),
    isRunningStandalone: isRunningStandalone(),
    getInstallInstructions: getInstallInstructions(),
    canPromptInstall: !!deferredPrompt
  };
}

export default usePWAInstall;