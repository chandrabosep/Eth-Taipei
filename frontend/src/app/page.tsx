import Image from 'next/image'

import { Button } from "@/components/ui/button"


const ghibliColors = {
  background: "#f8f5e6",
  card: "#f0e6c0",
  text: "#5a3e2b",
  border: "#b89d65",
  borderDark: "#8c7851",
  primary: "#b89d65",
  primaryHover: "#a08a55",
  accent: "#6b8e50",
  blue: "#4a90a0",
  cloud: "#d9e5f0"
}


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
     <Button variant="outline">Button</Button>

    </main>
  )
}
