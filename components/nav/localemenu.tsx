"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { setLocale } from "@/lib/actions/locales";

export default function LocaleMenu({ locale }: { locale: "en" | "ro" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="" asChild>
        <Button variant="outline" className="!w-32 py-5 !min-w-0">
          {locale === "ro" ? "Română" : "English"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="!w-32 !min-w-0">
        <DropdownMenuGroup className="">
          <DropdownMenuItem
            onClick={() => setLocale(locale === "ro" ? "en" : "ro")}
            className="!flex !items-center !justify-center"
          >
            {locale === "en" ? "Romanian" : "Engleză"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
