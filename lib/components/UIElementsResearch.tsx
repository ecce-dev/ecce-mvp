"use client"

import { EcceDialogProvider, EcceActionTrigger } from "@/lib/components/ecce-elements"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { MAX_WIDTH_TABLET, useDevice } from "@/lib/hooks/useDevice"
import posthog from "posthog-js"
import {
  BackButtonElement,
  garmentNameElement,
  publicResearchSwitch,
  descriptionTrigger,
  provenanceTrigger,
  constructionTrigger,
  createTiktokTrigger,
  createDialogContent,
} from "./UIElementsShared"

/**
 * Research UI Elements for garment detail view
 * 
 * Extended fields compared to public view:
 * - name, description, provenance, construction
 * - analytics, export functionality
 * 
 * Layout:
 * - Top Left: Back button
 * - Top Right: Mode switch (Public/Research)
 * - Desktop: Two rows
 *   - Row 1: Garment name, Description, TikTok (matching public)
 *   - Row 2: Provenance, Construction, Analytics, Export
 * - Mobile/Tablet: Wrapped flex row with all triggers
 */
export default function UIElementsResearch() {
  const { selectedGarment, deselectGarment, viewMode, setViewMode, userRole, logout } = useAppModeStore()
  const { deviceType } = useDevice()

  if (!selectedGarment) return null

  const garmentFields = selectedGarment.garmentFields
  const garmentName = garmentFields?.name ?? "Untitled Garment"
  const description = garmentFields?.description ?? ""
  const provenance = garmentFields?.provenance ?? ""
  const construction = garmentFields?.construction ?? ""
  const tiktokUrl = garmentFields?.linkToTiktok

  const handleAnalyticsClick = () => {
    posthog.capture("research_analytics_viewed", {
      garmentSlug: selectedGarment.slug,
      garmentName,
      userRole,
    })
    // TODO: Open analytics modal/panel
    console.log("Analytics clicked for:", garmentName)
  }

  const handleExportClick = () => {
    posthog.capture("research_export_initiated", {
      garmentSlug: selectedGarment.slug,
      garmentName,
      userRole,
    })
    // TODO: Implement export functionality
    console.log("Export clicked for:", garmentName)
  }

  const tiktokTrigger = createTiktokTrigger(tiktokUrl)

  const analyticsTrigger = (
    <EcceActionTrigger
      variant="secondary"
      className="pointer-events-auto"
      onAction={handleAnalyticsClick}
    >
      Analytics
    </EcceActionTrigger>
  )

  const exportTrigger = (
    <EcceActionTrigger
      variant="secondary"
      className="pointer-events-auto"
      onAction={handleExportClick}
    >
      Export
    </EcceActionTrigger>
  )

  {/* Hidden logout button - kept for future use */}
  const logoutButton = (
    <EcceActionTrigger
      variant="secondary"
      className="pointer-events-auto px-3 md:px-4 text-sm hidden"
      onAction={() => logout()}
      title={`Logged in as ${userRole}`}
    >
      Logout
    </EcceActionTrigger>
  )

  // Device-specific layouts
  const mobileNavbar = (
    <>
      {publicResearchSwitch(viewMode, setViewMode)}
      <div className="flex flex-col gap-2 w-full mt-9">
        {garmentNameElement(garmentName)}
        <div className="flex flex-row flex-wrap gap-2 w-full max-w-[370px]">
          {descriptionTrigger}
          {tiktokTrigger}
          {provenanceTrigger}
          {constructionTrigger}
          {analyticsTrigger}
          {exportTrigger}
        </div>
      </div>
    </>
  )

  const tabletNavbar = (
    <>
      {publicResearchSwitch(viewMode, setViewMode)}
      <div className="flex flex-col gap-2 w-full justify-center">
        <div className="mr-48 ml-18 flex flex-col justify-center items-center">
          {garmentNameElement(garmentName)}
        </div>
        <div className="flex flex-col flex-wrap gap-2 w-fit mt-2">
          {descriptionTrigger}
          {tiktokTrigger}
          {provenanceTrigger}
          {constructionTrigger}
          {analyticsTrigger}
          {exportTrigger}
        </div>
      </div>
    </>
  )

  const desktopNavbar = (
    <>
      {publicResearchSwitch(viewMode, setViewMode)}
      <div className="flex flex-col gap-2 2xl:gap-4 w-full">
        {/* Top row: garmentName, description, tiktok (matching public) */}
        <div className="flex flex-row gap-2 2xl:gap-4 justify-center mr-62 ml-19">
          {/* {garmentNameElement(garmentName)} */}
          {descriptionTrigger}
          {tiktokTrigger}
          {provenanceTrigger}
          {constructionTrigger}
          {analyticsTrigger}
          {exportTrigger}
        </div>
        {/* Second row: research-specific fields */}
        <div className="flex flex-row">
          {/* {provenanceTrigger}
          {constructionTrigger}
          {analyticsTrigger}
          {exportTrigger} */}
          {garmentNameElement(garmentName)}
        </div>
      </div>
    </>
  )

  return (
    <EcceDialogProvider>
      {/* Top navigation bar */}
      <div className="fixed safe-area-content top-6 left-6 right-6 flex pointer-events-none z-100">
        {/* Left section: Back button */}
        {BackButtonElement(deselectGarment, deviceType)}
        {deviceType === "mobile" && mobileNavbar}
        {deviceType === "tablet" && tabletNavbar}
        {deviceType === "desktop" && desktopNavbar}
      </div>

      {/* Content container for dialogs */}
      {/* Bottom values calculated to prevent overlap with ECCE logo (420px + p-8 padding) */}
      <div
        id="dialog-content-container-research"
        className={`fixed safe-area-content top-54 md:top-89 lg:top-104 min-[1360px]:top-33! 2xl:top-36! bottom-[150px] md:bottom-[180px] left-6 right-6 flex flex-col items-start pointer-events-none z-100`}
      >
        {/* Description content */}
        {createDialogContent("description", { title: garmentName, content: description })}

        {/* Provenance content */}
        {createDialogContent("provenance", { title: "Provenance", content: provenance })}

        {/* Construction content */}
        {createDialogContent("construction", { title: "Construction", content: construction })}
      </div>
    </EcceDialogProvider>
  )
}
