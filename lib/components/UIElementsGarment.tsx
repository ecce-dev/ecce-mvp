"use client"

import { EcceUnifiedDialogRenderer } from "@/lib/components/ecce-elements"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { useDevice } from "@/lib/hooks/useDevice"
import { useGarmentSessionTracking } from "@/lib/analytics"
import LoginModal from "./LoginModal"
import {
  BackButtonElement,
  garmentNameElement,
  publicResearchSwitch,
  TrackedDialogTrigger,
  TikTokTrigger,
  createHtmlContent,
  licensedTrigger,
  versionElement,
} from "./UIElementsShared"
import { AnalyticsDialogContent, ExportDialogContent } from "./AnalyticsUI"
import type { DeviceType } from "@/lib/hooks/useDevice"

// ============================================
// Configuration Types
// ============================================

type ViewMode = "public" | "research"

type TriggerId = 
  | "description" 
  | "tiktok" 
  | "provenance" 
  | "construction" 
  | "analytics" 
  | "export" 
  | "licensed" 
  | "version"

interface TriggerConfig {
  id: TriggerId
  component: React.ReactNode
  showInMobile?: boolean
  showInTablet?: boolean
  showInDesktop?: boolean
}

interface DialogConfig {
  id: string
  title: string
  content: React.ReactNode
}

interface LayoutConfig {
  mobile: React.ReactNode
  tablet: React.ReactNode
  desktop: React.ReactNode
}

interface ContainerClasses {
  main: string
  right: string
}

interface ModeConfig {
  triggers: TriggerConfig[]
  dialogs: Record<string, DialogConfig>
  layout: LayoutConfig
  containerClasses: ContainerClasses
  showLoginModal: boolean
  onResearchClick?: () => void
}

// ============================================
// Configuration Factory
// ============================================

function createModeConfig(
  mode: ViewMode,
  garmentData: {
    slug: string
    name: string
    description: string
    provenance: string
    construction: string
    rights: string
    version: string
    tiktokUrl?: string | null
    patternDescription?: string | null
    patternPngDownload?: any
    patternPngPreview?: any
  },
  userRole: "curator" | "designer" | "vc" | null,
  storeActions: {
    setViewMode: (mode: ViewMode) => void
    setLoginModalOpen: (open: boolean) => void
    isAuthenticated: boolean
  }
): ModeConfig {
  const { slug, name, description, provenance, construction, rights, version, tiktokUrl } = garmentData

  // Common trigger components
  const descriptionTrigger = (
    <TrackedDialogTrigger
      dialogId="description"
      label="Description"
      garmentSlug={slug}
      garmentName={name}
      mode={mode}
      userRole={userRole}
    />
  )

  const tiktokTrigger = tiktokUrl ? (
    <TikTokTrigger
      tiktokUrl={tiktokUrl}
      garmentSlug={slug}
      garmentName={name}
      mode={mode}
      userRole={userRole}
    />
  ) : null

  const provenanceTrigger = (
    <TrackedDialogTrigger
      dialogId="provenance"
      label="Provenance"
      garmentSlug={slug}
      garmentName={name}
      mode={mode}
      userRole={userRole}
    />
  )

  const constructionTrigger = (
    <TrackedDialogTrigger
      dialogId="construction"
      label="Construction"
      garmentSlug={slug}
      garmentName={name}
      mode={mode}
      userRole={userRole}
    />
  )

  const analyticsTrigger = (
    <TrackedDialogTrigger
      dialogId="analytics"
      label="Analytics"
      garmentSlug={slug}
      garmentName={name}
      mode={mode}
      userRole={userRole}
    />
  )

  const exportTrigger = (
    <TrackedDialogTrigger
      dialogId="export"
      label="Export"
      garmentSlug={slug}
      garmentName={name}
      mode={mode}
      userRole={userRole}
    />
  )

  const handleResearchClick = () => {
    if (storeActions.isAuthenticated) {
      storeActions.setViewMode("research")
    } else {
      storeActions.setLoginModalOpen(true)
    }
  }

  if (mode === "public") {
    // Public mode configuration
    const triggers: TriggerConfig[] = [
      {
        id: "description",
        component: descriptionTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "tiktok",
        component: tiktokTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "version",
        component: versionElement(version),
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "licensed",
        component: licensedTrigger(slug, name, userRole),
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
    ]

    const dialogs: Record<string, DialogConfig> = {
      description: {
        id: "description",
        title: name,
        content: createHtmlContent(description),
      },
      licensed: {
        id: "licensed",
        title: "Licensed",
        content: createHtmlContent(rights),
      },
    }

    // Public layouts
    const mobileNavbar = (
      <>
        {publicResearchSwitch("public", storeActions.setViewMode, handleResearchClick)}
        <div className="flex flex-col gap-2 w-full mt-9 relative">
          <div className="flex flex-row justify-between items-center gap-2">
            {garmentNameElement(name)}
          </div>
          <div className="flex flex-col w-fit max-w-[370px] gap-2">
            {descriptionTrigger}
            {tiktokTrigger}
          </div>
          <div className="absolute top-9.5 right-0 flex flex-col items-end gap-2">
            {versionElement(version)}
            {licensedTrigger(slug, name, userRole)}
          </div>
        </div>
      </>
    )

    const tabletNavbar = (
      <>
        {publicResearchSwitch("public", storeActions.setViewMode, handleResearchClick)}
        <div className="flex flex-col gap-2 w-full justify-center">
          <div className="mr-52 ml-18 flex flex-col justify-center items-center">
            {garmentNameElement(name)}
          </div>
          <div className="grid grid-cols-2">
            <div className="flex flex-col gap-2 w-full md:w-fit mt-2">
              {descriptionTrigger}
              {tiktokTrigger}
            </div>
            <div className="flex flex-col gap-2 justify-center items-end mt-2">
              {versionElement(version)}
              {licensedTrigger(slug, name, userRole)}
            </div>
          </div>
        </div>
      </>
    )

    const desktopNavbar = (
      <>
        {publicResearchSwitch("public", storeActions.setViewMode, handleResearchClick)}
        <div className="flex flex-col w-full gap-4">
          <div className="flex flex-row gap-4 justify-center mr-62 ml-18">
            {garmentNameElement(name)}
            {descriptionTrigger}
            {tiktokTrigger}
          </div>
          <div className="flex flex-col gap-2 justify-center items-end mt-2">
            {versionElement(version)}
            {licensedTrigger(slug, name, userRole)}
          </div>
        </div>
      </>
    )

    return {
      triggers,
      dialogs,
      layout: {
        mobile: mobileNavbar,
        tablet: tabletNavbar,
        desktop: desktopNavbar,
      },
      containerClasses: {
        main: "fixed safe-area-content top-44 md:top-44 lg:top-50 min-[1360px]:top-22! bottom-[150px] md:bottom-[180px] left-6 right-6 grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100",
        right: "fixed safe-area-content top-44 md:top-42 lg:top-48 min-[1360px]:top-50! 2xl:top-50! bottom-[150px] md:bottom-[180px] right-6 left-6 min-[470px]:left-auto grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100",
      },
      showLoginModal: true,
      onResearchClick: handleResearchClick,
    }
  } else {
    // Research mode configuration
    const triggers: TriggerConfig[] = [
      {
        id: "description",
        component: descriptionTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "provenance",
        component: provenanceTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "construction",
        component: constructionTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "analytics",
        component: analyticsTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "export",
        component: exportTrigger,
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "version",
        component: versionElement(version),
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
      {
        id: "licensed",
        component: licensedTrigger(slug, name, userRole),
        showInMobile: true,
        showInTablet: true,
        showInDesktop: true,
      },
    ]

    const dialogs: Record<string, DialogConfig> = {
      description: {
        id: "description",
        title: name,
        content: createHtmlContent(description),
      },
      provenance: {
        id: "provenance",
        title: "Provenance",
        content: createHtmlContent(provenance),
      },
      construction: {
        id: "construction",
        title: "Construction",
        content: createHtmlContent(construction),
      },
      analytics: {
        id: "analytics",
        title: "Analytics",
        content: (
          <AnalyticsDialogContent
            garmentSlug={slug}
            garmentName={name}
            userRole={userRole}
          />
        ),
      },
      export: {
        id: "export",
        title: "Export",
        content: (
          <ExportDialogContent
            garmentSlug={slug}
            garmentName={name}
            userRole={userRole}
            patternDescription={garmentData.patternDescription}
            patternPngDownload={garmentData.patternPngDownload}
            patternPngPreview={garmentData.patternPngPreview}
          />
        ),
      },
      licensed: {
        id: "licensed",
        title: "Licensed",
        content: createHtmlContent(rights),
      },
    }

    // Research layouts
    const mobileNavbar = (
      <>
        {publicResearchSwitch("research", storeActions.setViewMode)}
        <div className="flex flex-col gap-2 w-full mt-9 relative">
          <div className="flex flex-row justify-between items-center gap-2">
            {garmentNameElement(name)}
          </div>
          <div className="flex flex-col flex-wrap gap-2 w-fit max-w-[370px]">
            {descriptionTrigger}
            {provenanceTrigger}
            {constructionTrigger}
            {analyticsTrigger}
            {exportTrigger}
          </div>
          <div className="absolute top-9.5 right-0 flex flex-col items-end gap-2">
            {versionElement(version)}
            {licensedTrigger(slug, name, userRole)}
          </div>
        </div>
      </>
    )

    const tabletNavbar = (
      <>
        {publicResearchSwitch("research", storeActions.setViewMode)}
        <div className="flex flex-col gap-2 w-full justify-center">
          <div className="mr-52 ml-18 flex flex-col justify-center items-center">
            {garmentNameElement(name)}
          </div>
          <div className="flex w-full justify-between">
            <div className="flex flex-col flex-wrap gap-2 w-fit mt-2">
              {descriptionTrigger}
              {provenanceTrigger}
              {constructionTrigger}
              {analyticsTrigger}
              {exportTrigger}
            </div>
            <div className="flex flex-col items-end gap-2 mt-2">
              {versionElement(version)}
              {licensedTrigger(slug, name, userRole)}
            </div>
          </div>
        </div>
      </>
    )

    const desktopNavbar = (
      <>
        {publicResearchSwitch("research", storeActions.setViewMode)}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row gap-2 2xl:gap-4 justify-center mr-62 ml-19">
            {descriptionTrigger}
            {provenanceTrigger}
            {constructionTrigger}
            {analyticsTrigger}
            {exportTrigger}
          </div>
          <div className="flex flex-row justify-between mt-4">
            <div>
              {garmentNameElement(name)}
            </div>
            <div className="flex flex-col gap-2 justify-center items-end">
              {versionElement(version)}
              {licensedTrigger(slug, name, userRole)}
            </div>
          </div>
        </div>
      </>
    )

    return {
      triggers,
      dialogs,
      layout: {
        mobile: mobileNavbar,
        tablet: tabletNavbar,
        desktop: desktopNavbar,
      },
      containerClasses: {
        main: "fixed safe-area-content top-72 md:top-89 lg:top-104 min-[1360px]:top-33! 2xl:top-36! bottom-[150px] md:bottom-[180px] left-6 right-6 grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100",
        right: "fixed safe-area-content top-72 min-[633px]:top-44 md:top-42 lg:top-48 min-[1360px]:top-50! 2xl:top-50! bottom-[150px] md:bottom-[180px] right-6 left-6 min-[470px]:left-auto grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100",
      },
      showLoginModal: false,
    }
  }
}

// ============================================
// Main Component
// ============================================

interface UIElementsGarmentProps {
  mode: ViewMode
}

/**
 * Unified UI Elements component for garment detail view
 * Supports both Public and Research modes with mode-specific configurations
 * 
 * Layout:
 * - Top Left: Back button
 * - Top Right: Mode switch (Public/Research)
 * - Device-specific layouts for mobile, tablet, and desktop
 */
export default function UIElementsGarment({ mode }: UIElementsGarmentProps) {
  const {
    selectedGarment,
    deselectGarment,
    viewMode,
    setViewMode,
    isAuthenticated,
    userRole,
    setLoginModalOpen,
  } = useAppModeStore()
  const { deviceType } = useDevice()

  // Track garment session (selection and time spent)
  useGarmentSessionTracking()

  if (!selectedGarment) return null

  const garmentSlug = selectedGarment.slug ?? ""
  const garmentFields = selectedGarment.garmentFields
  const garmentName = garmentFields?.name ?? "Untitled Garment"
  const description = garmentFields?.description ?? ""
  const provenance = garmentFields?.provenance ?? ""
  const construction = garmentFields?.construction ?? ""
  const version = garmentFields?.version ?? ""
  const rights = garmentFields?.rights ?? ""
  const tiktokUrl = garmentFields?.linkToTiktok
  const patternDescription = garmentFields?.patternDescription
  const patternPngDownload = garmentFields?.patternPngDownload
  const patternPngPreview = garmentFields?.patternPngPreview

  // Create mode-specific configuration
  const config = createModeConfig(
    mode,
    {
      slug: garmentSlug,
      name: garmentName,
      description,
      provenance,
      construction,
      rights,
      version,
      tiktokUrl,
      patternDescription,
      patternPngDownload,
      patternPngPreview,
    },
    userRole,
    {
      setViewMode,
      setLoginModalOpen,
      isAuthenticated,
    }
  )

  // Get device-specific layout
  const currentLayout =
    deviceType === "mobile"
      ? config.layout.mobile
      : deviceType === "tablet"
      ? config.layout.tablet
      : config.layout.desktop

  // Determine dialog container IDs based on mode
  const mainContainerId = `dialog-content-container-${mode}`
  const rightContainerId = `dialog-content-container-${mode}-right`

  return (
    <>
      {/* Login Modal - only shown in public mode */}
      {config.showLoginModal && <LoginModal />}

      {/* Top navigation bar */}
      <div className="fixed safe-area-content top-6 left-6 right-6 flex pointer-events-none z-100">
        {/* Left section: Back button */}
        {BackButtonElement(deselectGarment, deviceType)}
        {currentLayout}
      </div>

      {/* Main Dialog Container */}
      <div id={mainContainerId} className={config.containerClasses.main}>
        <div className="col-start-1 row-start-1 max-h-full overflow-hidden max-w-[420px]">
          <EcceUnifiedDialogRenderer
            className="pointer-events-auto"
            maxHeight="100%"
            contentKey={selectedGarment.slug ?? ""}
            dialogs={Object.fromEntries(
              Object.entries(config.dialogs).filter(([key]) => key !== "licensed")
            )}
          />
        </div>
      </div>

      {/* Right Dialog Container (for Licensed dialog) */}
      {config.dialogs.licensed && (
        <div id={rightContainerId} className={config.containerClasses.right}>
          <div className="col-start-1 row-start-1 max-h-full overflow-hidden w-full max-w-[420px]">
            <EcceUnifiedDialogRenderer
              className="pointer-events-auto"
              maxHeight="100%"
              contentKey={selectedGarment.slug ?? ""}
              dialogs={{
                licensed: config.dialogs.licensed,
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
