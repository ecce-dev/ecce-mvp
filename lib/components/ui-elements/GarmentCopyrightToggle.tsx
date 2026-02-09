import { useAppModeStore } from "@/lib/stores/appModeStore";
import { cn } from "@/lib/utils/utils";
import { CopyrightIcon } from "@phosphor-icons/react";

export function GarmentCopyrightToggle() {
  const { showGarmentCopyright, setShowGarmentCopyright } = useAppModeStore();
  return (
    <div className="safe-area-content fixed bottom-40 right-16 md:bottom-4 md:right-22 z-50 flex items-center gap-2 rounded-full py-2">
      <button
        onClick={() => setShowGarmentCopyright(!showGarmentCopyright)}
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