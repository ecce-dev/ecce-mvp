"use client";

import { GavelIcon } from "@phosphor-icons/react";
import { EcceDialogContent, EcceDialogTrigger, EcceUnifiedDialogRenderer, useEcceDialog } from "@/lib/components/ecce-elements";
import { addTargetBlankToLinks, cn } from "@/lib/utils/utils";
import { createHtmlContent } from "./UIElementsShared";
import { useAppModeStore } from "@/lib/stores/appModeStore";

export function LegalRightsToggle() {
  return (
    // hidden on mobile because the animation mode has no effect when only one garment is loaded
    <div className="safe-area-content fixed bottom-40 md:bottom-4 right-12 md:right-14 z-50 md:flex items-center gap-2 rounded-full py-2">
      <EcceDialogTrigger
        dialogId="legalRights"
        variant="primary"
        asChild={true}
        className="pointer-events-auto bg-transparent border-0 p-0 m-0 text-base text-foreground"
      >
        <GavelIcon className="cursor-pointer" />
      </EcceDialogTrigger>
    </div>
  );
}


export function LegalRightsContent({ content }: { content: string | null }) {
  const viewMode = useAppModeStore((state) => state.viewMode);
  const selectedGarment = useAppModeStore((state) => state.selectedGarment);
  return (
    <>
      <div
        id={'legaRightsContainer'}
        className={cn(
          selectedGarment ? viewMode === "research" ? "top-70 md:top-72" : "top-40 md:top-40" : "top-40 md:top-20",
          "safe-area-content fixed lg:top-30 min-[1360px]:top-30! 2xl:top-30! bottom-[150px] md:bottom-[180px] left-6 right-6 grid grid-cols-1 items-stretch justify-items-center pointer-events-none z-100"
        )}
        >
        <div className="max-h-full overflow-hidden max-w-screen p-6 md:max-w-[720px]">
          <EcceUnifiedDialogRenderer
            className="pointer-events-auto"
            closeIcon={true}
            maxHeight="100%"
            contentKey={"legalRights"}
            dialogs={{
              legalRights: {
                title: "Legal Rights",
                content: createHtmlContent(content ?? ''),
              }
            }}
          />
        </div>
      </div>
    </>
  );
}