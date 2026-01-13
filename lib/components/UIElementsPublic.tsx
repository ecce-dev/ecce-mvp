"use client"

import { useState } from "react"
import {
  EcceDialogProvider,
  EcceDialogTrigger,
  EcceDialogContent,
  EcceActionTrigger,
} from "@/lib/components/ecce-dialog"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { useDevice } from "@/lib/hooks/useDevice"
import { cn } from "@/lib/utils/utils"
import LoginModal from "./LoginModal"

/**
 * Public UI Elements for garment detail view
 * 
 * Layout:
 * - Top Left: Back button, Description trigger, TikTok button
 * - Top Center: Garment name
 * - Top Right: Mode switch (Public/Research)
 */
export default function UIElementsPublic() {
  const { selectedGarment, deselectGarment, viewMode, setViewMode, isAuthenticated } = useAppModeStore()
  const { deviceType } = useDevice()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  if (!selectedGarment) return null

  const garmentFields = selectedGarment.garmentFields
  const garmentName = garmentFields?.name ?? "Untitled Garment"
  const description = garmentFields?.description ?? ""
  const tiktokUrl = garmentFields?.linkToTiktok

  const handleTiktokClick = () => {
    if (tiktokUrl) {
      window.open(tiktokUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleResearchClick = () => {
    if (isAuthenticated) {
      setViewMode("research")
    } else {
      setIsLoginModalOpen(true)
    }
  }


  const publicRessearchSwitch = <>
    <div className="fixed top-6 right-6 flex flex-row gap-0">
      <EcceActionTrigger
        variant="primary"
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
        variant="primary"
        className={cn(
          "pointer-events-auto px-3 md:px-4 -ml-[1px]",
          viewMode === "research"
            ? "bg-black text-white"
            : "bg-white/70 text-black hover:bg-white/90"
        )}
        onAction={handleResearchClick}
      >
        Research
      </EcceActionTrigger>
    </div>
  </>

  const garmentNameElement = <>
    <div className="px-4 py-1 md:py-2 pt-1 text-sm md:text-md lg:text-xl border border-black bg-white/70 font-ibm-plex-mono uppercase pointer-events-auto w-full text-center md:w-fit">
      {garmentName}
    </div>
  </>

  const descriptionTrigger = <>
    <EcceDialogTrigger
      dialogId="description"
      variant="secondary"
      className="pointer-events-auto"
    >
      Description
    </EcceDialogTrigger>
  </>


  const tiktokTrigger = <>
    {tiktokUrl && (
      <EcceActionTrigger
        variant="secondary"
        className="pointer-events-auto"
        onAction={handleTiktokClick}
      >
        Try via TikTok
      </EcceActionTrigger>
    )}
  </>

  const mobileNavbar = <>
    {publicRessearchSwitch}
    <div className="flex flex-col gap-2 w-full mt-9">
      {garmentNameElement}
      <div className="grid grid-cols-2 gap-2 w-full justify-center">
        {descriptionTrigger}
        {tiktokTrigger}

      </div>
    </div>
  </>
  const tabletNavbar = <>
    {publicRessearchSwitch}
    <div className="flex flex-col gap-2 w-full justify-center">
      <div className="mr-48 ml-18 flex flex-col justify-center items-center">

        {garmentNameElement}
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
    {publicRessearchSwitch}
    <div className="flex flex-row gap-2 w-full justify-center mr-62 ml-18">
      {garmentNameElement}
      {descriptionTrigger}
      {tiktokTrigger}
    </div>
  </>

  console.log('deviceType', deviceType)

  return (
    <EcceDialogProvider>
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Top navigation bar */}
      <div className="fixed safe-area-content top-6 left-6 right-6 flex pointer-events-none z-100">
        {/* Left section: Back button */}
        <div className="fixed top-6 left-6">
          <EcceActionTrigger
            variant="secondary"
            className="pointer-events-auto w-12 md:w-16 text-center"
            onAction={deselectGarment}
            aria-label="Go back"
          >
            &lt;
          </EcceActionTrigger>
        </div>
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

      {/* Content container for dialogs */}
      <div
        id="dialog-content-container-public"
        className="fixed safe-area-content top-36 md:top-44 lg:top-24 bottom-6 left-6 right-6 flex flex-col items-start pointer-events-none z-100"
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
      </div>
    </EcceDialogProvider>
  )
}
