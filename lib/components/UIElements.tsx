import { Button } from "./ui/button";

export default function UIElements() {
  return (
    <div className="fixed z-100 top-0 left-0 right-0 w-full flex justify-between items-center px-8 py-2">
      <Button variant="outline" className="font-zangezi">About</Button>
      <Button variant="outline" className="font-zangezi">Submit Request</Button>
      <Button variant="outline" className="font-zangezi">Explore</Button>
      <Button variant="outline" className="font-zangezi">Contact</Button>
    </div>
  )
}