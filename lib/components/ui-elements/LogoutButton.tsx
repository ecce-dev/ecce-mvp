import { SignOutIcon } from "@phosphor-icons/react";
import { useAppModeStore } from "../../stores/appModeStore";
import { useGarments } from "@/lib/context/GarmentsContext";
import { EcceActionTrigger } from "../ecce-elements";
import { Button } from "../ui/button";

export default function LogoutButton() {
  const { logout, selectedGarment, updateSelectedGarmentData } = useAppModeStore()
  const { reloadGarments } = useGarments()

  const handleLogout = async () => {
    await logout()

    // Re-fetch garments with private fields stripped
    const reloaded = await reloadGarments()

    // Update selected garment with filtered data if one is selected
    if (selectedGarment?.slug) {
      const updated = reloaded.find((g) => g.slug === selectedGarment.slug)
      if (updated) {
        updateSelectedGarmentData(updated)
      }
    }
  }

  return (
    <div className="safe-area-content fixed bottom-58 md:bottom-6 right-6 md:right-22 z-50 flex items-center rounded-full">

    <div
      className="pointer-events-auto cursor-pointer border-none bg-transparent p-0 m-0"
      onClick={handleLogout}
      title={`Logout`}
    >
      <SignOutIcon />
    </div>
    </div>
  )
}