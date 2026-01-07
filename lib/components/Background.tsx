import Image from "next/image";

export default function Background() {
  return (
    <div className="fixed z-1 top-0 left-0 right-0 h-full w-full flex flex-col justify-end items-center pb-8">
      <Image
        src="/ecce_logo_black.svg"
        alt="Background"
        width={420}
        height={420}
      />
    </div>
  )
}