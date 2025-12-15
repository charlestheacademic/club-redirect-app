import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

// --- Types ---
interface RedirectConfig {
  baseUrl: string;
  delaySeconds: number;
}

enum RedirectStatus {
  COUNTING = 'COUNTING',
  REDIRECTING = 'REDIRECTING',
}

// --- Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm mx-auto ${className}`}>
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, isLoading, className = '', disabled, ...props }) => {
  return (
    <button
      className={`
        w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200
        flex items-center justify-center gap-2
        ${disabled || isLoading 
          ? 'bg-indigo-400 cursor-not-allowed' 
          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md hover:shadow-lg'}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// --- Main App Logic ---

// This is the fallback URL if no destination is specified in the query params
const DEFAULT_DESTINATION = 'https://www.example.com/club-login';
const REDIRECT_DELAY_SECONDS = 3;

export default function App() {
  // State management for countdown and UI status
  const [countdown, setCountdown] = useState<number>(REDIRECT_DELAY_SECONDS);
  const [status, setStatus] = useState<RedirectStatus>(RedirectStatus.COUNTING);
  
  // Ref to prevent double redirection attempts
  const hasRedirectedRef = useRef<boolean>(false);

  /**
   * Constructs the final URL.
   */
  const getFinalRedirectUrl = useCallback((): string => {
    try {
      const currentParams = new URLSearchParams(window.location.search);
      
      // Check for dynamic destination provided in URL
      let targetBase = currentParams.get('destination') || currentParams.get('to') || DEFAULT_DESTINATION;
      
      let targetUrl: URL;
      try {
        targetUrl = new URL(targetBase);
      } catch (e) {
        targetUrl = new URL(DEFAULT_DESTINATION);
      }

      // Append all current params to the target, EXCEPT the ones used to define the destination
      currentParams.forEach((value, key) => {
        if (key !== 'destination' && key !== 'to') {
          targetUrl.searchParams.append(key, value);
        }
      });

      return targetUrl.toString();
    } catch (error) {
      console.error('Failed to construct redirect URL:', error);
      return DEFAULT_DESTINATION;
    }
  }, []);

  /**
   * Performs the actual redirection.
   */
  const performRedirect = useCallback(() => {
    if (hasRedirectedRef.current) return;
    
    hasRedirectedRef.current = true;
    setStatus(RedirectStatus.REDIRECTING);
    
    const finalUrl = getFinalRedirectUrl();
    
    setTimeout(() => {
      window.location.href = finalUrl;
    }, 500);
  }, [getFinalRedirectUrl]);

  /**
   * Effect: Countdown Timer
   */
  useEffect(() => {
    if (status === RedirectStatus.REDIRECTING) return;

    if (countdown > 0) {
      const timerId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    } else {
      performRedirect();
    }
  }, [countdown, status, performRedirect]);

  // --- Render Helpers ---

  const renderIcon = () => (
    <div className="flex justify-center mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
      <span role="img" aria-label="Rocket" className="text-7xl filter drop-shadow-md">
        🚀
      </span>
    </div>
  );

  const renderHeader = () => (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome, Club Member!
      </h1>
      <p className="text-gray-600 leading-relaxed">
        We're taking you to the secure login portal. Hang tight!
      </p>
    </div>
  );

  const renderStatus = () => {
    if (status === RedirectStatus.REDIRECTING) {
      return (
        <div className="mb-8 p-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-center animate-pulse">
          Redirecting now...
        </div>
      );
    }

    return (
      <div className="mb-8 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
          Auto Redirect In
        </p>
        <div className="text-4xl font-bold text-indigo-600 tabular-nums">
          {countdown} <span className="text-lg text-indigo-400 font-medium">sec</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <Card>
        {renderIcon()}
        {renderHeader()}
        {renderStatus()}

        <Button 
          onClick={performRedirect}
          disabled={status === RedirectStatus.REDIRECTING}
          isLoading={status === RedirectStatus.REDIRECTING}
        >
          Go to Login Page <ArrowRight size={18} />
        </Button>
        
        <div className="mt-6 text-center">
           <p className="text-xs text-gray-400">
             Not redirecting? Click the button above.
           </p>
        </div>
      </Card>
    </div>
  );
}
