import Image from "next/image";

export function EcceLogoBlack({
  width=420,
  height=420,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <Image src="/ecce_logo_black.svg" alt="Ecce Logo" width={width} height={height} className={className} />
  )
}

export function EcceLogoWhite({
  width=420,
  height=420,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <Image src="/ecce_logo_white.svg" alt="Ecce Logo" width={width} height={height} className={className} />
  )
}