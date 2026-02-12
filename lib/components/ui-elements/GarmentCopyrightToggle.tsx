import { useAppModeStore } from "@/lib/stores/appModeStore";
import { cn } from "@/lib/utils/utils";
import { CopyrightIcon } from "@phosphor-icons/react";
import { useEcceDialog } from "../ecce-elements";

export function GarmentCopyrightToggle() {
  const { showGarmentCopyright, setShowGarmentCopyright } = useAppModeStore();
  const { closeDialog } = useEcceDialog()
  return (
    <div className="safe-area-content fixed bottom-56 right-4 md:bottom-20 md:right-6 z-50 flex items-center gap-2 rounded-full py-2">
      <button
        onClick={() => {
          setShowGarmentCopyright(!showGarmentCopyright)
          closeDialog("legalRights")
        }}
        className={cn(
          "pointer-events-auto bg-transparent border-0 p-0 m-0 text-base text-foreground leading-none"
        )}
      >
        <CopyrightIcon
          className={cn("cursor-pointer rounded-full h-6 w-6 p-1 translate-x-1 translate-y-1", showGarmentCopyright && "bg-foreground text-background")}
        />
      </button>
    </div>
  )
}