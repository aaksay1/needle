"use client"

import Link from "next/link"
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"

export const navbarLinks = [
    {
        id: 0,
        name: 'Browse Requests',
        href: '/requests',
        description: 'View buyer requests',
        protected: false
    },
    {
        id: 1,
        name: 'Post Request',
        href: '/post-requests',
        description: 'Post what you need',
        protected: true
    },
    {
        id: 2,
        name: 'My Requests',
        href: '/my-requests',
        description: 'Manage your posts',
        protected: true
    },
    {
        id: 3,
        name: 'My Offers',
        href: '/my-offers',
        description: 'View your offers',
        protected: true
    },
    {
        id: 4,
        name: 'Messages',
        href: '/messages',
        description: 'Inbox',
        protected: true
    }
]

interface NavbarLinksProps {
    user: any
}

export function NavbarLinks({ user }: NavbarLinksProps) {
    return (
        <div className="hidden md:flex justify-center items-center col-span-6 gap-x-1">
            {navbarLinks.map((link) => {
                const isProtected = link.protected && !user
                const linkClassName = "px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                
                if (isProtected) {
                    return (
                        <LoginLink
                            key={link.id}
                            postLoginRedirectURL={link.href}
                            className={linkClassName}
                        >
                            {link.name}
                        </LoginLink>
                    )
                }
                
                return (
                    <Link 
                        key={link.id} 
                        href={link.href}
                        className={linkClassName}
                    >
                        {link.name}
                    </Link>
                )
            })}
        </div>
    )
}