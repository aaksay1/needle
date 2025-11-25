"use client"

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { navbarLinks } from "./NavbarLinks";
import Link from "next/link";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

interface MobileMenuProps {
    user: any
}

export function MobileMenu({ user }: MobileMenuProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon"
                    className="border-indigo-200 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                >
                    <Menu className="w-5 h-5"/>
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-white/95 backdrop-blur-lg border-l border-indigo-100">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="mt-8 flex flex-col gap-2 px-2">
                    {navbarLinks.map((item) => {
                        const isProtected = item.protected && !user
                        const linkClassName = "px-4 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        
                        if (isProtected) {
                            return (
                                <LoginLink
                                    key={item.id}
                                    postLoginRedirectURL={item.href}
                                    className={linkClassName}
                                >
                                    {item.name}
                                </LoginLink>
                            )
                        }
                        
                        return (
                            <Link 
                                href={item.href} 
                                key={item.id}
                                className={linkClassName}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
}