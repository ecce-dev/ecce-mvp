"use client"

import { EcceDialogProvider, EcceUnifiedDialogRenderer } from "@/lib/components/ecce-elements"
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
} from "./UIElementsShared"

/**
 * Public UI Elements for garment detail view
 * 
 * Layout:
 * - Top Left: Back button, Description trigger, TikTok button
 * - Top Center: Garment name
 * - Top Right: Mode switch (Public/Research)
 */
export default function UIElementsPublic() {
  const { 
    selectedGarment, 
    deselectGarment, 
    viewMode, 
    setViewMode, 
    isAuthenticated, 
    userRole,
    setLoginModalOpen 
  } = useAppModeStore()
  const { deviceType } = useDevice()

  // Track garment session (selection and time spent)
  useGarmentSessionTracking()

  if (!selectedGarment) return null

  const garmentSlug = selectedGarment.slug ?? ""
  const garmentFields = selectedGarment.garmentFields
  const garmentName = garmentFields?.name ?? "Untitled Garment"
  const description = garmentFields?.description ?? ""
  const tiktokUrl = garmentFields?.linkToTiktok

  const handleResearchClick = () => {
    if (isAuthenticated) {
      setViewMode("research")
    } else {
      setLoginModalOpen(true)
    }
  }

  // Tracked dialog trigger for description
  // In public mode, userRole is passed but will typically be null
  const descriptionTrigger = (
    <TrackedDialogTrigger
      dialogId="description"
      label="Description"
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="public"
      userRole={userRole}
    />
  )

  // Tracked TikTok trigger
  const tiktokTrigger = tiktokUrl ? (
    <TikTokTrigger
      tiktokUrl={tiktokUrl}
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="public"
      userRole={userRole}
    />
  ) : null

  const mobileNavbar = <>
    {publicResearchSwitch(viewMode, setViewMode, handleResearchClick)}
    <div className="flex flex-col gap-2 w-full mt-9">
      {garmentNameElement(garmentName)}
      <div className="grid grid-cols-2 gap-2 w-full justify-center">
        {descriptionTrigger}
        {tiktokTrigger}

      </div>
    </div>
  </>
  const tabletNavbar = <>
    {publicResearchSwitch(viewMode, setViewMode, handleResearchClick)}
    <div className="flex flex-col gap-2 w-full justify-center">
      <div className="mr-48 ml-18 flex flex-col justify-center items-center">
        {garmentNameElement(garmentName)}
      </div>
      <div className="flex flex-col gap-2 w-full md:w-fit mt-2">
        {descriptionTrigger}
        {tiktokTrigger}
        {/* <div className="flex flex-col gap-2 w-full justify-center">
      </div> */}
      </div>
    </div>
  </>
  const desktopNavbar = <>
    {publicResearchSwitch(viewMode, setViewMode, handleResearchClick)}
    <div className="flex flex-row gap-4 w-full justify-center mr-62 ml-18">
      {garmentNameElement(garmentName)}
      {descriptionTrigger}
      {tiktokTrigger}
    </div>
  </>

  return (
    <EcceDialogProvider>
      {/* Login Modal */}
      <LoginModal />

      {/* Top navigation bar */}
      <div className="fixed safe-area-content top-6 left-6 right-6 flex pointer-events-none z-100">
        {/* Left section: Back button */}
        {BackButtonElement(deselectGarment, deviceType)}
        {deviceType === "mobile" && mobileNavbar}
        {deviceType === "tablet" && tabletNavbar}
        {deviceType === "desktop" && desktopNavbar}
      </div>

      {/* Second row: Description trigger and TikTok button */}
      {/* <div className="fixed safe-area-content top-20 md:top-24 lg:top-24 left-6 flex pointer-events-none z-100">
        <div className="flex flex-row gap-2">
          <EcceDialogTrigger
            dialogId="description"
            variant="secondary"
            className="pointer-events-auto"
          >
            Description
          </EcceDialogTrigger>

          {tiktokUrl && (
            <EcceActionTrigger
              variant="secondary"
              className="pointer-events-auto"
              onAction={handleTiktokClick}
            >
              Try on via TikTok
            </EcceActionTrigger>
          )}
        </div>
      </div> */}

      {/* Unified Dialog Renderer - single transition for all dialogs */}
      {/* CSS Grid ensures content always appears at fixed position, preventing layout shifts */}
      <div
        id="dialog-content-container-public"
        className="fixed safe-area-content top-36 md:top-44 lg:top-50 min-[1360px]:top-22! bottom-[150px] md:bottom-[180px] left-6 right-6 grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100"
      >
        <div className="col-start-1 row-start-1 max-h-full overflow-hidden">
          <EcceUnifiedDialogRenderer
            className="pointer-events-auto"
            maxHeight="100%"
            contentKey={selectedGarment.slug ?? ""}
            dialogs={{
              description: {
                title: garmentName,
                content: createHtmlContent(description),
              },
            }}
          />
        </div>
      </div>
    </EcceDialogProvider>
  )
}
