import Link from "next/link"

export const navbarLinks = [
    {
        id: 0,
        name: 'Browse Requests',
        href: '/requests',
        description: 'View buyer requests'
    },
    {
        id: 1,
        name: 'Post Request',
        href: '/requests/new',
        description: 'Post what you need'
    },
    {
        id: 2,
        name: 'My Requests',
        href: '/my-requests',
        description: 'Manage your posts'
    },
    {
        id: 3,
        name: 'My Offers',
        href: '/my-offers',
        description: 'View your offers'
    },
    {
        id: 4,
        name: 'Messages',
        href: '/messages',
        description: 'Inbox'
    }
]

export function NavbarLinks() {
    return (
        <div className="hidden md:flex justify-center items-center col-span-6 gap-x-1">
            {navbarLinks.map((link) => (
                <Link 
                    key={link.id} 
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                    {link.name}
                </Link>
            ))}
        </div>
    )
}