"use client"

import { EcceDialogProvider, EcceActionTrigger, EcceUnifiedDialogRenderer } from "@/lib/components/ecce-elements"
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { useDevice } from "@/lib/hooks/useDevice"
import { useGarmentSessionTracking } from "@/lib/analytics"
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

  // Tracked dialog triggers with userRole for identifying authenticated user type
  const descriptionTrigger = (
    <TrackedDialogTrigger
      dialogId="description"
      label="Description"
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="research"
      userRole={userRole}
    />
  )

  const provenanceTrigger = (
    <TrackedDialogTrigger
      dialogId="provenance"
      label="Provenance"
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="research"
      userRole={userRole}
    />
  )

  const constructionTrigger = (
    <TrackedDialogTrigger
      dialogId="construction"
      label="Construction"
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="research"
      userRole={userRole}
    />
  )

  const analyticsTrigger = (
    <TrackedDialogTrigger
      dialogId="analytics"
      label="Analytics"
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="research"
      userRole={userRole}
    />
  )

  const exportTrigger = (
    <TrackedDialogTrigger
      dialogId="export"
      label="Export"
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="research"
      userRole={userRole}
    />
  )

  // Tracked TikTok trigger
  const tiktokTrigger = tiktokUrl ? (
    <TikTokTrigger
      tiktokUrl={tiktokUrl}
      garmentSlug={garmentSlug}
      garmentName={garmentName}
      mode="research"
      userRole={userRole}
    />
  ) : null

  {/* Hidden logout button - kept for future use */ }
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
        <div className="flex flex-row justify-between items-center gap-2">
          {garmentNameElement(garmentName)}
          {versionElement(version)}
        </div>
        <div className="flex flex-row flex-wrap gap-2 w-full max-w-[370px]">
          {descriptionTrigger}
          {tiktokTrigger}
          {provenanceTrigger}
          {constructionTrigger}
          {licensedTrigger(garmentSlug, garmentName, userRole)}
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
        <div className="flex w-full justify-between">
          <div className="flex flex-col flex-wrap gap-2 w-fit mt-2">
            {descriptionTrigger}
            {tiktokTrigger}
            {provenanceTrigger}
            {constructionTrigger}
            {analyticsTrigger}
            {exportTrigger}
          </div>
          <div className="flex flex-col items-end"></div>
          <div className="flex flex-col items-end gap-2">
            {versionElement(version)}
            {licensedTrigger(garmentSlug, garmentName, userRole)}
          </div>
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
        <div className="flex flex-row justify-between">
          <div>
            {garmentNameElement(garmentName)}
          </div>
          <div className="flex flex-col gap-2 justify-center items-end">
            {versionElement(version)}
            {licensedTrigger(garmentSlug, garmentName, userRole)}
          </div>
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

      {/* Unified Dialog Renderer - single transition for all dialogs */}
      {/* CSS Grid ensures content always appears at fixed position, preventing layout shifts */}
      <div
        id="dialog-content-container-research"
        className={`fixed safe-area-content top-54 md:top-89 lg:top-104 min-[1360px]:top-33! 2xl:top-36! bottom-[150px] md:bottom-[180px] left-6 right-6 grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100`}
      >
        <div className="col-start-1 row-start-1 max-h-full overflow-hidden w-full max-w-[420px]">
          <EcceUnifiedDialogRenderer
            className="pointer-events-auto"
            maxHeight="100%"
            contentKey={selectedGarment.slug ?? ""}
            dialogs={{
              description: {
                title: garmentName,
                content: createHtmlContent(description),
              },
              provenance: {
                title: "Provenance",
                content: createHtmlContent(provenance),
              },
              construction: {
                title: "Construction",
                content: createHtmlContent(construction),
              },
              analytics: {
                title: "Analytics",
                content: (
                  <AnalyticsDialogContent
                    garmentSlug={selectedGarment.slug ?? ""}
                    garmentName={garmentName}
                    userRole={userRole}
                  />
                ),
              },
              export: {
                title: "Export",
                content: (
                  <ExportDialogContent
                    garmentSlug={selectedGarment.slug ?? ""}
                    garmentName={garmentName}
                    userRole={userRole}
                    patternDescription={patternDescription}
                    patternPngDownload={patternPngDownload}
                    patternPngPreview={patternPngPreview}
                  />
                ),
              },
            }}
          />

        </div>
      </div>
      <div
        id="dialog-content-container-research-right"
        className={`fixed safe-area-content top-54 md:top-42 lg:top-48 min-[1360px]:top-48! 2xl:top-50! bottom-[150px] md:bottom-[180px] left-6 md:left-auto right-6 grid grid-cols-1 items-stretch justify-items-start pointer-events-none z-100`}
      >
        <div className="col-start-1 row-start-1 max-h-full overflow-hidden w-full max-w-[420px]">
          <EcceUnifiedDialogRenderer
            className="pointer-events-auto"
            maxHeight="100%"
            contentKey={selectedGarment.slug ?? ""}
            dialogs={{
              licensed: {
                title: "Licensed",
                content: createHtmlContent(rights),
              },
            }}
          />
        </div>
      </div>
    </EcceDialogProvider>
  )
}
