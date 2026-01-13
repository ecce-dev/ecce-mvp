import Lottie from "lottie-react";
import ecceLogoLoading from "./ecce_logo_loading.json";

export default function EcceLoadingLottie() {
  return (
    <Lottie
      animationData={ecceLogoLoading}
      loop={true}
      // className="w-24 h-24"
    />
  )
} 