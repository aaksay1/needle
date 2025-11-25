import Link from "next/link";
import { NavbarLinks, navbarLinks } from "./NavbarLinks";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { MobileMenu } from "./MobileMenu";
import { UserNav } from "./UserNav";

export async function Navbar() {
    const {getUser} = getKindeServerSession()

    const user = await getUser()

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-indigo-100 shadow-sm">
            <div className="max-w-7xl w-full flex md:grid md:grid-cols-12 items-center px-4 md:px-8 mx-auto py-4">
                <div className="md:col-span-3 flex items-center justify-between w-full md:w-auto">
                    <Link href="/" className="group hover:opacity-90 transition-opacity">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <span className="text-white font-bold text-lg">N</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Needle
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5">Reverse Marketplace</p>
                            </div>
                        </div>
                    </Link>
                </div>
                <NavbarLinks user={user} />
                
                {/* Auth Buttons - Desktop */}
                <div className="hidden md:flex items-center justify-end gap-3 col-span-3">
                    {user ? (
                        <UserNav 
                            email={user.email as string} 
                            name={user.given_name as string}
                            userImage ={
                                user.picture ?? `https://avatar.vercel.sh/${user.given_name}`
                            }
                        />
                    ): (
                        <div className="flex items-center gap-x-2">
                            <LoginLink 
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                Login
                            </LoginLink>
                            <RegisterLink
                                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                Sign up
                            </RegisterLink>

                        </div>
                    )}

                </div>
                <div className="md:hidden">
                    <MobileMenu user={user} />
                </div>

            </div>
             
        </nav>
    )
}  