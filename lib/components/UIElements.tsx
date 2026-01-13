"use client"

import { Button } from "@/lib/components/ui/button"
import {
  EcceDialogProvider,
  EcceDialogTrigger,
  EcceDialogContent,
  EcceActionTrigger,
} from "@/lib/components/ecce-dialog"
import { useGarments } from "@/lib/context/GarmentsContext"
import { useDevice } from "../hooks/useDevice";
import { cn } from "../utils/utils";
import posthog from "posthog-js";

/**
 * Main UI Elements component
 * Contains all ECCE dialog triggers and content
 * 
 * Both triggers and content use flex containers with pointer-events:none
 * to allow canvas interaction while handling layout.
 * Interactive elements have pointer-events:auto to remain clickable.
 */
export default function UIElements({ aboutContent, contactContent }: { aboutContent: string | null, contactContent: string | null }) {
  const { refreshGarments, isLoading } = useGarments();
  const { deviceType } = useDevice();

  const handleExploreClick = async () => {
    const { previous, current } = await refreshGarments();
    posthog.capture('explore_clicked', {
      previousGarments: previous,
      newGarments: current,
      userType: 'visitor',
    });
  };

  return (
    <EcceDialogProvider>
      {/* 
        Trigger container: 
        - Fixed positioning spans the top of the screen
        - pointer-events-none allows clicks to pass through to canvas
        - flex justify-between distributes buttons evenly
        - Order: About → Submit Request → Explore → Contact
      */}
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
        - flex with justify-between for left/center/right positioning
        - Wrapper divs maintain layout positions even when dialogs are closed
        - Each content has pointer-events-auto when visible
      */}
      <div
        id="dialog-content-container"
        className="fixed safe-area-content top-40 md:top-20 lg:top-24 bottom-6 left-6 right-6 flex flex-col items-start md:flex-row md:justify-between md:items-stretch pointer-events-none z-100"
      >
        {/* Left slot: About content */}
        <div className="flex-shrink-0">
          <EcceDialogContent
            dialogId="about"
            className="pointer-events-auto"
          >
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aboutContent ?? '' }} />
          </EcceDialogContent>
        </div>

        {/* Center slot: Submit Request content - vertically centered on tablet/desktop */}
        <div className="md:flex md:items-center md:justify-center md:h-full">
          <EcceDialogContent
            dialogId="submit-request"
            className="pointer-events-auto"
          >
            <h4 className="mb-4">Submit Request</h4>
            <div className="space-y-4">
              {/* Empty div for future form content */}
              <div className="min-h-[100px]" />
              <Button className="w-full">Send</Button>
            </div>
          </EcceDialogContent>
        </div>

        {/* Right slot: Contact content */}
        <div className="flex-shrink-0">
          <EcceDialogContent
            dialogId="contact"
            className="pointer-events-auto"
          >
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: contactContent ?? '' }} />
          </EcceDialogContent>
        </div>
      </div>
    </EcceDialogProvider>
  )
}
