import { useState } from "react"
import { LessThanIcon, DownloadSimpleIcon, ChartLineIcon } from "@phosphor-icons/react"
import { DeviceType } from "../hooks/useDevice"
import { EcceActionTrigger, EcceDialogTrigger, EcceDialogContent } from "./ecce-elements"
import { Switch } from "./ui/switch"
import { cn } from "../utils/utils"
import posthog from "posthog-js"

// ============================================
// Garment Name Element
// ============================================
export const garmentNameElement = (garmentName: string) => (
  <div className="px-4 py-1 md:py-2 pt-1 text-sm md:text-md lg:text-xl border border-black bg-white/70 font-zangezi uppercase pointer-events-auto w-full text-center md:w-fit">
    <span className="inline-block translate-y-[2px]">{garmentName}</span>
  </div>
)

// ============================================
// Back Button Element
// ============================================
export const BackButtonElement = (deselectGarment: () => void, deviceType: DeviceType) => (
  <div className="fixed top-6 left-6">
    <EcceActionTrigger
      variant="secondary"
      className="pointer-events-auto w-12 md:w-16 text-center py-0.5"
      onAction={deselectGarment}
      aria-label="Go back"
    >
      <LessThanIcon size={deviceType === "desktop" ? 20 : deviceType === "tablet" ? 16 : 14} className="translate-y-[2px]" />
    </EcceActionTrigger>
  </div>
)

// ============================================
// Public/Research View Mode Switch
// ============================================
export const publicResearchSwitch = (viewMode: "public" | "research", setViewMode: (viewMode: "public" | "research") => void) => (
  <div className="fixed top-6 right-6 flex flex-row gap-0">
    <EcceActionTrigger
      variant="primary"
      className={cn(
        "pointer-events-auto px-3 md:px-4",
        viewMode === "public"
          ? "bg-black text-white"
          : "bg-white/70 text-black0"
      )}
      onAction={() => setViewMode("public")}
    >
      Public
    </EcceActionTrigger>
    <EcceActionTrigger
      variant="primary"
      className={cn(
        "pointer-events-auto px-3 md:px-4 -ml-[1px]",
        viewMode === "research"
          ? "bg-black text-white"
          : "bg-white/70 text-black"
      )}
      onAction={() => setViewMode("research")}
    >
      Research
    </EcceActionTrigger>
  </div>
)

// ============================================
// Dialog Trigger Elements
// ============================================
export const descriptionTrigger = (
  <EcceDialogTrigger
    dialogId="description"
    variant="secondary"
    className="pointer-events-auto"
  >
    Description
  </EcceDialogTrigger>
)

export const provenanceTrigger = (
  <EcceDialogTrigger
    dialogId="provenance"
    variant="secondary"
    className="pointer-events-auto"
  >
    Provenance
  </EcceDialogTrigger>
)

export const constructionTrigger = (
  <EcceDialogTrigger
    dialogId="construction"
    variant="secondary"
    className="pointer-events-auto"
  >
    Construction
  </EcceDialogTrigger>
)

// ============================================
// TikTok Trigger Element
// ============================================
export const createTiktokTrigger = (tiktokUrl: string | null | undefined) => {
  if (!tiktokUrl) return null
  
  const handleTiktokClick = () => {
    window.open(tiktokUrl, "_blank", "noopener,noreferrer")
  }
  
  return (
    <EcceActionTrigger
      variant="secondary"
      className="pointer-events-auto"
      onAction={handleTiktokClick}
    >
      Try via TikTok
    </EcceActionTrigger>
  )
}

// ============================================
// Dialog Content Elements
// ============================================

/**
 * Creates HTML content for use with EcceUnifiedDialogRenderer
 * Renders HTML string as React element with proper styling
 */
export const createHtmlContent = (htmlContent: string) => {
  if (!htmlContent) return null
  return (
    <div
      className="text-sm leading-relaxed prose prose-sm"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

interface DialogContentProps {
  title: string
  content: string
}

/**
 * @deprecated Use EcceUnifiedDialogRenderer with createHtmlContent instead
 * This creates independent transitions that can cause layout shifts when switching dialogs
 */
export const createDialogContent = (dialogId: string, { title, content }: DialogContentProps) => (
  <div className="max-h-full">
    <EcceDialogContent dialogId={dialogId} className="pointer-events-auto">
      {/* <h4 className="font-zangezi uppercase text-xl mb-4">{title}</h4> */}
      {content && (
        <div
          className="text-sm leading-relaxed prose prose-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </EcceDialogContent>
  </div>
)

// ============================================
// Analytics Dialog Content
// ============================================
interface AnalyticsDialogContentProps {
  garmentSlug: string
  garmentName: string
  userRole: string | null
}

/**
 * Analytics dialog content for Research mode
 * Displays garment engagement metrics and tracking data
 */
export function AnalyticsDialogContent({ garmentSlug, garmentName, userRole }: AnalyticsDialogContentProps) {
  // Track analytics view
  posthog.capture("research_analytics_viewed", {
    garmentSlug,
    garmentName,
    userRole,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ChartLineIcon size={20} weight="regular" />
        <h4 className="font-zangezi uppercase text-lg">Analytics</h4>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600 font-ibm-plex-mono">
          Engagement metrics for <span className="font-medium">{garmentName}</span>
        </p>

        {/* Placeholder metrics - to be replaced with real data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-black/20 p-3 bg-white/50">
            <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Views</p>
            <p className="text-2xl font-zangezi">—</p>
          </div>
          <div className="border border-black/20 p-3 bg-white/50">
            <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Interactions</p>
            <p className="text-2xl font-zangezi">—</p>
          </div>
          <div className="border border-black/20 p-3 bg-white/50">
            <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Avg. Time</p>
            <p className="text-2xl font-zangezi">—</p>
          </div>
          <div className="border border-black/20 p-3 bg-white/50">
            <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">TikTok Clicks</p>
            <p className="text-2xl font-zangezi">—</p>
          </div>
        </div>

        <p className="text-xs font-ibm-plex-mono text-gray-400 italic">
          Analytics data coming soon
        </p>
      </div>
    </div>
  )
}

// ============================================
// Export Dialog Content
// ============================================
interface PatternMediaItem {
  node?: {
    altText?: string | null
    mediaItemUrl?: string | null
  } | null
}

interface ExportDialogContentProps {
  garmentSlug: string
  garmentName: string
  userRole: string | null
  patternDescription?: string | null
  patternPngDownload?: PatternMediaItem | null
  patternPngPreview?: PatternMediaItem | null
}

/**
 * Export dialog content for Research mode
 * Displays pattern preview and provides download functionality
 */
export function ExportDialogContent({
  garmentSlug,
  garmentName,
  userRole,
  patternDescription,
  patternPngDownload,
  patternPngPreview,
}: ExportDialogContentProps) {
  const previewUrl = patternPngPreview?.node?.mediaItemUrl
  const previewAlt = patternPngPreview?.node?.altText ?? `Pattern preview for ${garmentName}`
  const downloadUrl = patternPngDownload?.node?.mediaItemUrl

  const [isInverted, setIsInverted] = useState(false)

  const handleDownload = () => {
    if (!downloadUrl) return

    posthog.capture("research_export_initiated", {
      garmentSlug,
      garmentName,
      userRole,
      exportFormat: "pattern_png",
    })

    // Trigger download
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${garmentSlug}-pattern.png`
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasPattern = previewUrl || downloadUrl || patternDescription

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center gap-2">
        <DownloadSimpleIcon size={20} weight="regular" />
        <h4 className="font-zangezi uppercase text-lg">Export</h4>
      </div> */}

      {hasPattern ? (
        <div className="space-y-4">
          {/* Pattern Preview Image */}
          {previewUrl && (
            <div className="space-y-2">
              {/* Invert Switch */}
              <div className="flex items-center justify-end gap-2">
                <label 
                  htmlFor="invert-switch" 
                  className="text-xs font-ibm-plex-mono text-gray-600 cursor-pointer"
                >
                  Invert Colors
                </label>
                <Switch
                  id="invert-switch"
                  checked={isInverted}
                  onCheckedChange={setIsInverted}
                />
              </div>
              
              <div className="border border-black/20 bg-white/50 p-2">
                <img
                  src={previewUrl}
                  alt={previewAlt}
                  className={cn(
                    "w-full h-auto max-h-[420px] object-contain transition-all duration-200",
                    isInverted && "invert"
                  )}
                  loading="lazy"
                />
              </div>
            </div>
          )}


          {/* Pattern Description */}
          {patternDescription && (
            <div className="space-y-2">
              {/* <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Pattern Description</p> */}
              <p className="text-sm font-ibm-plex-mono text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: patternDescription }} />
            </div>
          )}

          
          {/* Download Button */}
          {downloadUrl ? (
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 p-3 border border-black bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <DownloadSimpleIcon size={18} weight="bold" />
              <span className="font-ibm-plex-mono text-sm font-medium">Download Pattern PNG</span>
            </button>
          ) : (
            <p className="text-xs font-ibm-plex-mono text-gray-400 italic text-center">
              No download file available
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm font-ibm-plex-mono text-gray-500">
            No pattern data available for this garment
          </p>
        </div>
      )}
    </div>
  )
}