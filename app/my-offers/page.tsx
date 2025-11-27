import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { OfferCard } from "./OfferCard";

export default async function MyOffersPage() {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        redirect("/api/auth/login?post_login_redirect_url=/my-offers");
    }

    // Ensure user exists in database
    await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
            id: user.id,
            email: user.email ?? "",
            firstName: user.given_name ?? "",
            lastName: user.family_name ?? "",
            profileImage: user.picture ?? `https://avatar.vercel.sh/${user.given_name}`,
        },
    });

    // Fetch received offers (offers made on products posted by this user)
    const receivedOffers = await prisma.offer.findMany({
        where: {
            product: {
                userId: user.id,
            },
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                },
            },
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Fetch sent offers (offers made by this user)
    const sentOffers = await prisma.offer.findMany({
        where: {
            senderId: user.id,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    User: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
                    <p className="mt-2 text-gray-600">
                        View offers you've sent and received
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Received Offers Section */}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            Received Offers
                        </h2>
                        {receivedOffers.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No received offers yet
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    You haven't received any offers on your product requests yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {receivedOffers.map((offer) => (
                                    <OfferCard key={offer.id} offer={offer} isReceived={true} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sent Offers Section */}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            Sent Offers
                        </h2>
                        {sentOffers.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No sent offers yet
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    You haven't sent any offers yet. Browse requests to make an offer!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sentOffers.map((offer) => {
                                    // Transform the offer to match OfferCard props
                                    const transformedOffer = {
                                        id: offer.id,
                                        status: offer.status,
                                        amount: offer.amount,
                                        message: offer.message,
                                        createdAt: offer.createdAt,
                                        product: offer.product,
                                        sender: {
                                            id: offer.product.User?.id || "",
                                            firstName: offer.product.User?.firstName || "Unknown",
                                            lastName: offer.product.User?.lastName || "User",
                                            email: offer.product.User?.email || "",
                                        },
                                    };
                                    return <OfferCard key={offer.id} offer={transformedOffer} isReceived={false} />;
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

