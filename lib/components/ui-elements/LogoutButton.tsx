import { SignOutIcon } from "@phosphor-icons/react";
import { useAppModeStore } from "../../stores/appModeStore";
import { EcceActionTrigger } from "../ecce-elements";
import { Button } from "../ui/button";

export default function LogoutButton() {
  const { logout } = useAppModeStore()
  return (
    <div className="fixed bottom-58 md:bottom-6 right-6 md:right-22 z-50 flex items-center rounded-full">

    <div
      className="pointer-events-auto cursor-pointer border-none bg-transparent p-0 m-0"
      onClick={() => logout()}
      title={`Logout`}
    >
      <SignOutIcon />
    </div>
    </div>
  )
}