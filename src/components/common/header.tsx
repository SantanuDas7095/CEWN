import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, University } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/sos", label: "SOS" },
  { href: "/hospital", label: "Hospital" },
  { href: "/mess", label: "Mess" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold" prefetch={false}>
          <University className="h-6 w-6 text-primary" />
          <span className="text-lg font-headline">NIT Agartala CEWN</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="transition-colors hover:text-primary"
              prefetch={false}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="grid gap-6 p-6">
              <Link href="/" className="flex items-center gap-2 font-bold" prefetch={false}>
                <University className="h-6 w-6 text-primary" />
                <span className="text-lg font-headline">NIT Agartala CEWN</span>
              </Link>
              <nav className="grid gap-4">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-lg font-medium transition-colors hover:text-primary"
                    prefetch={false}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
