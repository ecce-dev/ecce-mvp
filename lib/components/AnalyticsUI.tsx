"use client"

import { useState, useEffect } from "react"
import { ChartLineIcon, GlobeIcon, DownloadSimpleIcon } from "@phosphor-icons/react"
import { Switch } from "./ui/switch"
import { cn, addTargetBlankToLinks } from "../utils/utils"
import posthog from "posthog-js"
import { getGarmentAnalytics, type GarmentAnalytics, type InterestLevel } from "@/lib/actions/getGarmentAnalytics"

// ============================================
// Analytics Dialog Content
// ============================================
interface AnalyticsDialogContentProps {
  garmentSlug: string
  garmentName: string
  userRole: string | null
}

/**
 * Interest level labels for display
 */
const INTEREST_LABELS: Record<InterestLevel, string> = {
  1: "Very Low",
  2: "Low",
  3: "Low-Medium",
  4: "Medium",
  5: "Medium-High",
  6: "High",
  7: "Very High",
}

/**
 * Format seconds into a human-readable duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Interest meter component - 7-step visual indicator
 */
function InterestMeter({ level, color }: { level: InterestLevel; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Interest Level</span>
        <span 
          className="text-sm font-ibm-plex-mono font-medium"
          style={{ color }}
        >
          {INTEREST_LABELS[level]}
        </span>
      </div>
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5, 6, 7] as InterestLevel[]).map((step) => (
          <div
            key={step}
            className="h-3 flex-1 rounded-sm transition-all"
            style={{
              backgroundColor: step <= level ? color : "#e5e7eb",
            }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Analytics dialog content for Research mode
 * Displays garment engagement metrics and tracking data
 */
export function AnalyticsDialogContent({ garmentSlug, garmentName, userRole }: AnalyticsDialogContentProps) {
  const [analytics, setAnalytics] = useState<GarmentAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  useEffect(() => {
    let isMounted = true

    async function fetchAnalytics() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getGarmentAnalytics(garmentSlug)
        if (isMounted) {
          setAnalytics(data)
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
        if (isMounted) {
          setError("Failed to load analytics data")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAnalytics()

    // Track analytics view
    posthog.capture("research_analytics_viewed", {
      garmentSlug,
      garmentName,
      userRole,
    })

    return () => {
      isMounted = false
    }
  }, [garmentSlug, garmentName, userRole])

  // Calculate total interactions from action breakdown
  const totalInteractions = analytics
    ? Object.values(analytics.actionBreakdown).reduce((sum, count) => sum + count, 0)
    : 0

  return (
    <div className="space-y-6 w-full">
      {/* <div className="flex items-center gap-2">
        <ChartLineIcon size={20} weight="regular" />
        <h4 className="font-zangezi uppercase text-lg">Analytics</h4>
      </div> */}
      
      <div className="space-y-4">
        {/* <p className="text-sm text-gray-600 font-ibm-plex-mono">
          Engagement metrics for <span className="font-medium">{garmentName}</span>
        </p> */}

        {/* Loading state */}
        {isLoading && (
          <div className="py-8 text-center">
            <p className="text-sm font-ibm-plex-mono text-gray-500 animate-pulse">
              Loading analytics...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="py-8 text-center">
            <p className="text-sm font-ibm-plex-mono text-red-500">{error}</p>
          </div>
        )}

        {/* Analytics data */}
        {analytics && !isLoading && (
          <>
            {/* Interest Meter */}
            <div className="border border-black/20 p-4 bg-white/50">
              <InterestMeter level={analytics.interestLevel} color={analytics.interestColor} />
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-black/20 p-3 bg-white/50">
                <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Views</p>
                <p className="text-2xl font-zangezi">{analytics.totalViews}</p>
              </div>
              <div className="border border-black/20 p-3 bg-white/50">
                <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Interactions</p>
                <p className="text-2xl font-zangezi">{totalInteractions}</p>
              </div>
              <div className="border border-black/20 p-3 bg-white/50">
                <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Total Time</p>
                <p className="text-2xl font-zangezi">{formatDuration(analytics.totalTimeSpent)}</p>
              </div>
              <div className="border border-black/20 p-3 bg-white/50">
                <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Avg. Time</p>
                <p className="text-2xl font-zangezi">{formatDuration(analytics.avgTimePerView)}</p>
              </div>
            </div>

            {/* Top Countries */}
            {analytics.topCountries.length > 0 && (
              <div className="border border-black/20 p-4 bg-white/50">
                <div className="flex items-center gap-2 mb-3">
                  <GlobeIcon size={16} weight="regular" className="text-gray-500" />
                  <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase">Top Countries</p>
                </div>
                <div className="space-y-2">
                  {analytics.topCountries.map((country, index) => (
                    <div key={country.countryCode} className="flex items-center justify-between">
                      <span className="text-sm font-ibm-plex-mono">
                        {index + 1}. {country.country}
                      </span>
                      <span className="text-sm font-ibm-plex-mono text-gray-500">
                        {country.count} views
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Breakdown */}
            {totalInteractions > 0 && (
              <div className="border border-black/20 p-4 bg-white/50 w-full">
                <p className="text-xs font-ibm-plex-mono text-gray-500 uppercase mb-3">Action Breakdown</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 lg:gap-8 text-sm font-ibm-plex-mono">
                  {analytics.actionBreakdown.description > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description</span>
                      <span>{analytics.actionBreakdown.description}</span>
                    </div>
                  )}
                  {analytics.actionBreakdown.tiktok > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">TikTok</span>
                      <span>{analytics.actionBreakdown.tiktok}</span>
                    </div>
                  )}
                  {analytics.actionBreakdown.provenance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provenance</span>
                      <span>{analytics.actionBreakdown.provenance}</span>
                    </div>
                  )}
                  {analytics.actionBreakdown.construction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Construction</span>
                      <span>{analytics.actionBreakdown.construction}</span>
                    </div>
                  )}
                  {analytics.actionBreakdown.export > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Export</span>
                      <span>{analytics.actionBreakdown.export}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No data state */}
            {analytics.totalViews === 0 && (
              <p className="text-xs font-ibm-plex-mono text-gray-400 italic text-center py-4">
                No engagement data recorded yet
              </p>
            )}
          </>
        )}
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
              <p className="text-sm font-ibm-plex-mono text-gray-700 leading-relaxed wpAcfWysiwyg" dangerouslySetInnerHTML={{ __html: addTargetBlankToLinks(patternDescription) }} />
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
