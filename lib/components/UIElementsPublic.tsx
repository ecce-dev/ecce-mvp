"use client"

import { useState } from "react"
import { EcceDialogProvider } from "@/lib/components/ecce-elements"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { useDevice } from "@/lib/hooks/useDevice"
import LoginModal from "./LoginModal"
import {
  BackButtonElement,
  garmentNameElement,
  publicResearchSwitch,
  descriptionTrigger,
  createTiktokTrigger,
  createDialogContent,
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
  const { selectedGarment, deselectGarment, viewMode, setViewMode, isAuthenticated } = useAppModeStore()
  const { deviceType } = useDevice()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  if (!selectedGarment) return null

  const garmentFields = selectedGarment.garmentFields
  const garmentName = garmentFields?.name ?? "Untitled Garment"
  const description = garmentFields?.description ?? ""
  const tiktokUrl = garmentFields?.linkToTiktok

  const handleResearchClick = () => {
    if (isAuthenticated) {
      setViewMode("research")
    } else {
      setIsLoginModalOpen(true)
    }
  }

  const tiktokTrigger = createTiktokTrigger(tiktokUrl)

  const mobileNavbar = <>
    {publicResearchSwitch(viewMode, setViewMode)}
    <div className="flex flex-col gap-2 w-full mt-9">
      {garmentNameElement(garmentName)}
      <div className="grid grid-cols-2 gap-2 w-full justify-center">
        {descriptionTrigger}
        {tiktokTrigger}

      </div>
    </div>
  </>
  const tabletNavbar = <>
    {publicResearchSwitch(viewMode, setViewMode)}
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
    {publicResearchSwitch(viewMode, setViewMode)}
    <div className="flex flex-row gap-4 w-full justify-center mr-62 ml-18">
      {garmentNameElement(garmentName)}
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

      {/* Content container for dialogs */}
      {/* Bottom values calculated to prevent overlap with ECCE logo (420px + p-8 padding) */}
      <div
        id="dialog-content-container-public"
        className="fixed safe-area-content top-36 md:top-44 lg:top-50 min-[1360px]:top-22! bottom-[150px] md:bottom-[180px] left-6 right-6 flex flex-col items-start pointer-events-none z-100"
      >
        {/* Description content */}
        {createDialogContent("description", { title: garmentName, content: description })}
      </div>
    </EcceDialogProvider>
  )
}
