import Image from "next/image";

export default function Background() {
  return (
    <div className="safe-area-content fixed inset-0 z-1">
      <div className="h-full w-full flex flex-col justify-end items-center p-8">
        <Image
          src="/ecce_logo_black.svg"
          alt="Background"
          width={420}
          height={420}
        />
        
      </div>
    </div>
  )
}