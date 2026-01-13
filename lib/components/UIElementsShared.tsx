import { LessThanIcon } from "@phosphor-icons/react"
import { DeviceType } from "../hooks/useDevice"
import { EcceActionTrigger, EcceDialogTrigger, EcceDialogContent } from "./ecce-dialog"
import { cn } from "../utils/utils"

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
interface DialogContentProps {
  title: string
  content: string
}

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