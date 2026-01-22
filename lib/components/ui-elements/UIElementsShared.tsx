import { ArrowLeftIcon, LessThanIcon } from "@phosphor-icons/react"
import { DeviceType } from "@/lib/hooks/useDevice"
import { EcceActionTrigger, EcceDialogTrigger } from "@/lib/components/ecce-elements"
import { cn, addTargetBlankToLinks } from "@/lib/utils/utils"
import { postHogCapture } from "@/lib/utils/posthog"
import { useAppModeStore } from "@/lib/stores/appModeStore"

// ============================================
// Garment Name Element
// ============================================
export const garmentNameElement = (garmentName: string) => (
  <div className="text-nowrap overflow-hidden text-ellipsis px-4 py-1 md:py-2 pt-1 max-[420px]:text-xs max-[420px]:py-1.5 text-sm md:text-md lg:text-xl border border-foreground bg-background/70 font-zangezi uppercase pointer-events-auto w-full text-center md:max-w-md lg:max-w-lg xl:max-w-xl">
    <span className="inline-block max-[420px]:translate-y-[2px] translate-y-[2px]">{garmentName}</span>
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
      <ArrowLeftIcon size={deviceType === "desktop" ? 20 : deviceType === "tablet" ? 16 : 14} className="translate-y-[2px]" />
    </EcceActionTrigger>
  </div>
)

// ============================================
// Public/Research View Mode Switch
// ============================================

interface PublicResearchSwitchOptions {
  viewMode: "public" | "research"
  setViewMode: (viewMode: "public" | "research") => void
  /** Optional custom handler for Research click (e.g., to show login modal) */
  onResearchClick?: () => void
}

/**
 * Mode switch component for Public/Research views
 * @param options.viewMode - Current view mode
 * @param options.setViewMode - Function to set view mode
 * @param options.onResearchClick - Optional custom handler for Research button (overrides default setViewMode)
 */
export const publicResearchSwitch = (
  viewMode: "public" | "research", 
  setViewMode: (viewMode: "public" | "research") => void,
  onResearchClick?: () => void
) => (
  <div className="fixed top-6 right-6 flex flex-row gap-0">
    <EcceActionTrigger
      variant="primary"
      className={cn(
        "pointer-events-auto px-3 md:px-4",
        viewMode === "public"
          ? "bg-foreground text-background"
          : "bg-background/70 text-foreground"
      )}
      onAction={() => setViewMode("public")}
    >
      Encounter
    </EcceActionTrigger>
    <EcceActionTrigger
      variant="primary"
      className={cn(
        "pointer-events-auto px-3 md:px-4 -ml-[1px]",
        viewMode === "research"
          ? "bg-foreground text-background"
          : "bg-background/70 text-foreground"
      )}
      onAction={onResearchClick ?? (() => setViewMode("research"))}
    >
      Engage
    </EcceActionTrigger>
  </div>
)

// ============================================
// Tracked Dialog Trigger Elements (with analytics)
// ============================================

type TrackedDialogId = "description" | "provenance" | "construction" | "analytics" | "export" | "licensed"

/** User role type for analytics tracking */
type UserRoleType = "curator" | "designer" | "vc" | null

interface TrackedDialogTriggerProps {
  dialogId: TrackedDialogId
  label: string
  garmentSlug: string
  garmentName: string
  mode: "public" | "research"
  /** User role if authenticated (null for public/anonymous users) */
  userRole?: UserRoleType
}

/**
 * Dialog trigger with analytics tracking
 * Tracks when users open specific dialog content
 * Includes user_role to identify the type of authenticated user
 */
export function TrackedDialogTrigger({ 
  dialogId, 
  label, 
  garmentSlug, 
  garmentName, 
  mode,
  userRole = null,
}: TrackedDialogTriggerProps) {
  const handleClick = () => {
    postHogCapture("garment_action_clicked", {
      garment_slug: garmentSlug,
      garment_name: garmentName,
      mode,
      user_role: userRole,
      action_type: dialogId,
    })
  }

  return (
    <EcceDialogTrigger
      dialogId={dialogId}
      variant="secondary"
      className="pointer-events-auto"
      onClick={handleClick}
    >
      {label}
    </EcceDialogTrigger>
  )
}

// ============================================
// TikTok Trigger Element (with analytics tracking)
// ============================================

interface TikTokTriggerProps {
  tiktokUrl: string
  garmentSlug: string
  garmentName: string
  mode: "public" | "research"
  /** User role if authenticated (null for public/anonymous users) */
  userRole?: UserRoleType
}

/**
 * TikTok trigger with analytics tracking
 * Includes user_role to identify the type of authenticated user
 */
export function TikTokTrigger({ 
  tiktokUrl, 
  garmentSlug, 
  garmentName, 
  mode,
  userRole = null,
}: TikTokTriggerProps) {
  const handleTiktokClick = () => {
    // Track the click
    postHogCapture("garment_action_clicked", {
      garment_slug: garmentSlug,
      garment_name: garmentName,
      mode,
      user_role: userRole,
      action_type: "tiktok",
    })
    
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
      className="text-sm leading-relaxed prose prose-sm wpAcfWysiwyg"
      dangerouslySetInnerHTML={{ __html: addTargetBlankToLinks(htmlContent) }}
    />
  )
}


export const licensedTrigger = (
  garmentSlug: string,
  garmentName: string,
  userRole: UserRoleType,
  publicDomain: boolean,
  viewMode: "public" | "research",
) => {
  return (
    <TrackedDialogTrigger
      dialogId="licensed"
      label={publicDomain ? "public domain" : "licensed"}
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode={viewMode}
      userRole={userRole}
    />
  )
}


// Version display element (no action, just displays content)
export const versionElement = (version: string) => (
  version ? (
  <EcceActionTrigger
    variant="secondary"
    className="pointer-events-auto cursor-default max-w-20"
  >
    <span dangerouslySetInnerHTML={{ __html: addTargetBlankToLinks(version) }} className="" />
  </EcceActionTrigger>
) : null)