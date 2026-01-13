"use client"

import {
  EcceDialogProvider,
  EcceDialogTrigger,
  EcceDialogContent,
  EcceActionTrigger,
} from "@/lib/components/ecce-dialog"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { useDevice } from "@/lib/hooks/useDevice"
import { cn } from "@/lib/utils/utils"
import posthog from "posthog-js"

/**
 * Research UI Elements for garment detail view
 * 
 * Extended fields compared to public view:
 * - name, description, provenance, construction
 * - analytics, export functionality
 * 
 * Layout:
 * - Top Left: Back button
 * - Top Center: Garment name
 * - Top Right: Mode switch (Public/Research)
 * - Second row: Description, Provenance, Construction, Analytics, Export
 */
export default function UIElementsResearch() {
  const { selectedGarment, deselectGarment, viewMode, setViewMode, isAuthenticated, userRole, logout } = useAppModeStore()
  const { deviceType } = useDevice()

  if (!selectedGarment) return null

  const garmentFields = selectedGarment.garmentFields
  const garmentName = garmentFields?.name ?? "Untitled Garment"
  const description = garmentFields?.description ?? ""
  const provenance = garmentFields?.provenance ?? ""
  const construction = garmentFields?.construction ?? ""
  const tiktokUrl = garmentFields?.linkToTiktok

  const handleTiktokClick = () => {
    if (tiktokUrl) {
      window.open(tiktokUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleAnalyticsClick = () => {
    // Track analytics view event
    posthog.capture("research_analytics_viewed", {
      garmentSlug: selectedGarment.slug,
      garmentName,
      userRole,
    })
    // TODO: Open analytics modal/panel
    console.log("Analytics clicked for:", garmentName)
  }

  const handleExportClick = () => {
    // Track export event
    posthog.capture("research_export_initiated", {
      garmentSlug: selectedGarment.slug,
      garmentName,
      userRole,
    })
    // TODO: Implement export functionality
    console.log("Export clicked for:", garmentName)
  }

  return (
    <EcceDialogProvider>
      {/* Top navigation bar */}
      <div className="fixed safe-area-content top-6 left-6 right-6 flex pointer-events-none z-100">
        <div
          className={cn(
            "flex flex-row justify-between w-full gap-2",
            deviceType === "mobile" && "flex-col"
          )}
        >
          {/* Left section: Back button */}
          <div className="flex flex-row gap-2">
            <EcceActionTrigger
              variant="secondary"
              className="pointer-events-auto w-12 md:w-14 lg:w-16 text-center"
              onAction={deselectGarment}
              aria-label="Go back"
            >
              &lt;
            </EcceActionTrigger>
          </div>

          {/* Center section: Garment name */}
          <div className="flex items-center justify-center flex-1">
            <div className="px-4 py-1 md:py-2 text-lg md:text-2xl lg:text-2xl border border-black bg-white/70 font-zangezi uppercase pointer-events-auto md:pt-3">
              {garmentName}
            </div>
          </div>

          {/* Right section: Mode switch and logout */}
          <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-row gap-0">
              <EcceActionTrigger
                variant="secondary"
                className={cn(
                  "pointer-events-auto px-3 md:px-4",
                  viewMode === "public"
                    ? "bg-black text-white"
                    : "bg-white/70 text-black hover:bg-white/90"
                )}
                onAction={() => setViewMode("public")}
              >
                Public
              </EcceActionTrigger>
              <EcceActionTrigger
                variant="secondary"
                className={cn(
                  "pointer-events-auto px-3 md:px-4 -ml-[1px]",
                  viewMode === "research"
                    ? "bg-black text-white"
                    : "bg-white/70 text-black hover:bg-white/90"
                )}
                onAction={() => setViewMode("research")}
              >
                Research
              </EcceActionTrigger>
            </div>
            <EcceActionTrigger
              variant="secondary"
              className="pointer-events-auto px-3 md:px-4 text-sm"
              onAction={() => logout()}
              title={`Logged in as ${userRole}`}
            >
              Logout
            </EcceActionTrigger>
          </div>
        </div>
      </div>

      {/* Second row: Research-specific triggers */}
      <div className="fixed safe-area-content top-20 md:top-24 lg:top-24 left-6 right-6 flex pointer-events-none z-100">
        <div
          className={cn(
            "flex flex-row gap-2 flex-wrap",
            deviceType === "mobile" && "flex-col"
          )}
        >
          <EcceDialogTrigger
            dialogId="description"
            variant="primary"
            className="pointer-events-auto"
          >
            Description
          </EcceDialogTrigger>

          <EcceDialogTrigger
            dialogId="provenance"
            variant="primary"
            className="pointer-events-auto"
          >
            Provenance
          </EcceDialogTrigger>

          <EcceDialogTrigger
            dialogId="construction"
            variant="primary"
            className="pointer-events-auto"
          >
            Construction
          </EcceDialogTrigger>

          {tiktokUrl && (
            <EcceActionTrigger
              variant="primary"
              className="pointer-events-auto"
              onAction={handleTiktokClick}
            >
              TikTok
            </EcceActionTrigger>
          )}

          <EcceActionTrigger
            variant="primary"
            className="pointer-events-auto"
            onAction={handleAnalyticsClick}
          >
            Analytics
          </EcceActionTrigger>

          <EcceActionTrigger
            variant="primary"
            className="pointer-events-auto"
            onAction={handleExportClick}
          >
            Export
          </EcceActionTrigger>
        </div>
      </div>

      {/* Content container for dialogs */}
      <div
        id="dialog-content-container-research"
        className="fixed safe-area-content top-36 md:top-40 lg:top-36 bottom-6 left-6 right-6 flex flex-col md:flex-row md:justify-between items-start pointer-events-none z-100 gap-4"
      >
        {/* Description content */}
        <div className="flex-shrink-0">
          <EcceDialogContent dialogId="description" className="pointer-events-auto">
            <h4 className="font-zangezi uppercase text-xl mb-4">{garmentName}</h4>
            {description && (
              <div
                className="text-sm leading-relaxed prose prose-sm"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </EcceDialogContent>
        </div>

        {/* Provenance content */}
        <div className="flex-shrink-0">
          <EcceDialogContent dialogId="provenance" className="pointer-events-auto">
            <h4 className="font-zangezi uppercase text-xl mb-4">Provenance</h4>
            {provenance && (
              <div
                className="text-sm leading-relaxed prose prose-sm"
                dangerouslySetInnerHTML={{ __html: provenance }}
              />
            )}
          </EcceDialogContent>
        </div>

        {/* Construction content */}
        <div className="flex-shrink-0">
          <EcceDialogContent dialogId="construction" className="pointer-events-auto">
            <h4 className="font-zangezi uppercase text-xl mb-4">Construction</h4>
            {construction && (
              <div
                className="text-sm leading-relaxed prose prose-sm"
                dangerouslySetInnerHTML={{ __html: construction }}
              />
            )}
          </EcceDialogContent>
        </div>
      </div>
    </EcceDialogProvider>
  )
}
