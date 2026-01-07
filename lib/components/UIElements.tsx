"use client"

import { Button } from "@/lib/components/ui/button"
import {
  EcceDialogProvider,
  EcceDialogTrigger,
  EcceDialogContent,
  EcceActionTrigger,
} from "@/lib/components/ecce-dialog"

/**
 * Main UI Elements component
 * Contains all ECCE dialog triggers and content
 * 
 * Both triggers and content use flex containers with pointer-events:none
 * to allow canvas interaction while handling layout.
 * Interactive elements have pointer-events:auto to remain clickable.
 */
export default function UIElements({ aboutContent, contactContent }: { aboutContent: string | null, contactContent: string | null }) {
  const handleExploreClick = () => {
    // TODO: Implement explore functionality
    console.log("Explore clicked")
  }

  return (
    <EcceDialogProvider>
      {/* 
        Trigger container: 
        - Fixed positioning spans the top of the screen
        - pointer-events-none allows clicks to pass through to canvas
        - flex justify-between distributes buttons evenly
        - Order: About → Submit Request → Explore → Contact
      */}
      <div className="fixed top-6 left-6 right-6 flex justify-between pointer-events-none z-100">
        <EcceDialogTrigger
          dialogId="about"
          variant="primary"
          className="pointer-events-auto"
        >
          About
        </EcceDialogTrigger>

        <EcceDialogTrigger
          dialogId="submit-request"
          variant="primary"
          className="pointer-events-auto"
        >
          Submit Request
        </EcceDialogTrigger>

        <EcceActionTrigger
          variant="primary"
          className="pointer-events-auto"
          onAction={handleExploreClick}
        >
          Explore
        </EcceActionTrigger>

        <EcceDialogTrigger
          dialogId="contact"
          variant="primary"
          className="pointer-events-auto"
        >
          Contact
        </EcceDialogTrigger>
      </div>

      {/* 
        Content container:
        - Fixed positioning below triggers
        - pointer-events-none allows clicks to pass through to canvas
        - flex with justify-between for left/center/right positioning
        - Wrapper divs maintain layout positions even when dialogs are closed
        - Each content has pointer-events-auto when visible
      */}
      <div className="fixed top-24 bottom-6 left-6 right-6 flex justify-between items-stretch pointer-events-none z-100">
        {/* Left slot: About content */}
        <div className="flex-shrink-0">
          <EcceDialogContent
            dialogId="about"
            className="pointer-events-auto"
          >
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aboutContent ?? '' }} />
          </EcceDialogContent>
        </div>

        {/* Center slot: Submit Request content - vertically centered */}
        <div className="flex items-center justify-center h-full">
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
