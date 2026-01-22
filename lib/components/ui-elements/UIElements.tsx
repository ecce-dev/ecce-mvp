"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  EcceDialogTrigger,
  EcceDialogContent,
  EcceActionTrigger,
} from "@/lib/components/ecce-elements"
// Lazy load form component to defer Zod bundle until form is actually opened
const SubmitRequestForm = dynamic(
  () => import("@/lib/components/ui-elements/SubmitRequestForm").then(mod => ({ default: mod.SubmitRequestForm })),
  { ssr: false }
)
import { CountdownProgress } from "@/lib/components/ui-elements/CountdownProgress"
import { useGarments } from "@/lib/context/GarmentsContext"
import { useDevice } from "@/lib/hooks/useDevice";
import { cn, addTargetBlankToLinks } from "@/lib/utils/utils";
// Use dynamic PostHog import to avoid bundling in initial load
import { postHogCapture } from "@/lib/utils/posthog";
import { LegalRightsContent } from "./LegalRightsToggle"

/**
 * Main UI Elements component
 * Contains all ECCE dialog triggers and content
 * 
 * Both triggers and content use flex containers with pointer-events:none
 * to allow canvas interaction while handling layout.
 * Interactive elements have pointer-events:auto to remain clickable.
 * 
 * Includes auto-refresh functionality that loads new garments every 30s.
 */
export default function UIElements({ aboutContent, contactContent, legalRightsContent }: { aboutContent: string | null, contactContent: string | null, legalRightsContent: string | null }) {
  const { refreshGarments, isLoading } = useGarments();
  const { deviceType } = useDevice();

  // Trigger to reset countdown when user manually explores
  const [manualRefreshCount, setManualRefreshCount] = useState(0);

  // WYSIWYG CSS is now loaded via inline script in layout.tsx
  // This prevents it from blocking initial render
  // No need to load it here as it's handled at the document level

  /**
   * Handle manual explore click
   * Resets the auto-refresh countdown and tracks analytics
   */
  const handleExploreClick = useCallback(async () => {
    // Reset countdown timer immediately
    setManualRefreshCount((prev) => prev + 1);
    
    const { previous, current } = await refreshGarments();
    // Use deferred PostHog capture to avoid blocking
    postHogCapture('explore_clicked', {
      previousGarments: previous,
      newGarments: current,
      userType: 'visitor',
      trigger: 'manual',
    });
  }, [refreshGarments]);

  return (
    <>
      {/* 
        Trigger container: 
        - Fixed positioning spans the top of the screen
        - pointer-events-none allows clicks to pass through to canvas
        - flex justify-between distributes buttons evenly
        - Order: About → Submit Request → Explore → Contact
      */}
      <LegalRightsContent content={legalRightsContent ?? ''} />

      <div className="fixed safe-area-content top-6 left-6 right-6 flex pointer-events-none z-100">
        <div className={cn("flex flex-row justify-between w-full gap-2", deviceType === "mobile" && "flex-col")}>
          <EcceDialogTrigger
            dialogId="about"
            variant="primary"
            className="pointer-events-auto w-[180px] md:w-[210px] lg:w-[230px]"
          >
            About
          </EcceDialogTrigger>

          <EcceDialogTrigger
            dialogId="submit-request"
            variant="primary"
            className="pointer-events-auto w-[180px] md:w-[210px] lg:w-[230px]"
          >
            Submit Request
          </EcceDialogTrigger>

          <EcceActionTrigger
            variant="primary"
            className="pointer-events-auto w-[180px] md:w-[210px] lg:w-[230px]"
            onAction={handleExploreClick}
            disabled={isLoading}
          >
            Explore
          </EcceActionTrigger>

          <EcceDialogTrigger
            dialogId="contact"
            variant="primary"
            className="pointer-events-auto w-[180px] md:w-[210px] lg:w-[230px]"
          >
            Contact
          </EcceDialogTrigger>

        </div>
      </div>

      {/* 
        Content container:
        - Fixed positioning below triggers
        - pointer-events-none allows clicks to pass through to canvas
        - Mobile: single-column grid where all dialogs occupy the same cell (overlap)
        - Tablet/Desktop: 3-column grid ensures center slot stays centered
        - This prevents position shifts during dialog transition animations
        - Each content has pointer-events-auto when visible
      */}
      <div
        id="dialog-content-container"
        className="fixed safe-area-content top-40 md:top-20 lg:top-24 bottom-6 left-6 right-6 grid grid-cols-1 md:grid-cols-3 items-stretch pointer-events-none z-100"
      >
        {/* Left slot: About content - same cell on mobile, first column on tablet/desktop */}
        <div className="col-start-1 row-start-1 justify-self-start md:col-start-1 max-h-full overflow-hidden">
          <EcceDialogContent
            dialogId="about"
            className="pointer-events-auto"
          >
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: addTargetBlankToLinks(aboutContent ?? '') }} />
          </EcceDialogContent>
        </div>

        {/* Center slot: Submit Request content - same cell on mobile, centered in second column on tablet/desktop */}
        <div className="col-start-1 row-start-1 justify-self-start md:col-start-2 md:justify-self-center md:self-center max-h-full w-full overflow-hidden flex items-center justify-center">
          <EcceDialogContent
            dialogId="submit-request"
            className="pointer-events-auto p-0 border-0 bg-transparent"
          >
            {/* <h4 className="mb-4">Submit Request</h4> */}
            <SubmitRequestForm />
          </EcceDialogContent>
        </div>

        {/* Right slot: Contact content - same cell on mobile, third column on tablet/desktop */}
        <div className="col-start-1 row-start-1 justify-self-start md:col-start-3 md:justify-self-end max-h-full overflow-hidden">
          <EcceDialogContent
            dialogId="contact"
            className="pointer-events-auto"
          >
            <p className="text-sm leading-relaxed wpAcfWysiwyg" dangerouslySetInnerHTML={{ __html: addTargetBlankToLinks(contactContent ?? '') }} />
          </EcceDialogContent>
        </div>
      </div>
    </>
  )
}
