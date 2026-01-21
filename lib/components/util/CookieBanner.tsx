'use client';

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { CookieIcon } from "@phosphor-icons/react";


export function CookieBanner() {
  const [consentGiven, setConsentGiven] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // We want this to only run once the client loads
    // or else it causes a hydration error
    const status = posthog.get_explicit_consent_status();
    setConsentGiven(status);

    // Show banner with animation if consent is pending
    if (status === 'pending') {
      // Small delay to ensure smooth animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleAcceptCookies = () => {
    posthog.opt_in_capturing();
    setConsentGiven('granted');
    setIsVisible(false);
  };

  const handleDeclineCookies = () => {
    posthog.opt_out_capturing();
    setConsentGiven('denied');
    setIsVisible(false);
  };

  // Don't render if consent has been given or denied
  if (consentGiven !== 'pending' || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-[9998]",
        "animate-fade-in",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        "px-4 sm:px-6"
      )}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div
        className={cn(
          "mx-auto max-w-xl",
          "bg-popover/95 backdrop-blur-md",
          "border border-foreground/50",
          "rounded-none shadow-lg",
          "p-4 sm:p-6",
          "space-y-4"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-row items-center">
              <CookieIcon className="w-4 h-4 mr-2" />
              <h4 className="text-lg font-semibold text-popover-foreground">
                Your consent is required
              </h4>
            </div>

          </div>
          <p className="text-sm text-popover-foreground/90 leading-relaxed">
            To continously improve the experience, cookies are used.
          </p>
          {/* <p className="text-xs text-popover-foreground/80">
            By clicking "Accept all cookies", you consent to our use of analytics cookies. 
            You can decline or learn more in our{" "}
            <Link
              href="/privacy-policy"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="eccePrimary"
            size="default"
            onClick={handleDeclineCookies}
            className="w-full sm:w-auto"
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="ecceSecondary"
            size="default"
            onClick={handleAcceptCookies}
            className="w-full sm:w-auto"
          >
            Accept all cookies
          </Button>
        </div>
      </div>
    </div>
  );
}