"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptOffer, rejectOffer } from "@/app/actions";
import { Loader2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface OfferCardProps {
    offer: {
        id: string;
        status: string;
        amount: number;
        message: string | null;
        createdAt: Date;
        product: {
            id: string;
            name: string;
            description: string;
            price: number;
        };
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    isReceived?: boolean;
}

export function OfferCard({ offer, isReceived = false }: OfferCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    
    const senderName = `${offer.sender.firstName} ${offer.sender.lastName}`;
    const offerAmount = (offer.amount / 100).toFixed(2);
    const productPrice = (offer.product.price / 100).toFixed(2);
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        accepted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };

    const handleAccept = async () => {
        if (!confirm("Are you sure you want to accept this offer? This will create a conversation with the sender.")) {
            return;
        }
        
        setIsProcessing(true);
        try {
            const result = await acceptOffer(offer.id);
            // Force a hard refresh to ensure conversations are updated
            router.refresh();
            // Small delay to ensure server state is updated
            setTimeout(() => {
                router.refresh();
            }, 500);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to accept offer");
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to reject this offer? This will permanently delete it.")) {
            return;
        }
        
        setIsProcessing(true);
        try {
            await rejectOffer(offer.id);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to reject offer");
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {offer.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {isReceived ? `From: ${senderName}` : `To: ${senderName}`}
                    </p>
                </div>
                <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        statusColors[offer.status as keyof typeof statusColors] || statusColors.pending
                    }`}
                >
                    {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </span>
            </div>

            <p className="text-gray-600 mb-2 line-clamp-2 text-sm">
                {offer.product.description}
            </p>

            <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Original Price:</span>
                    <span className="text-sm font-medium text-gray-700">
                        ${productPrice}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                        {isReceived ? "Offer Amount:" : "Your Offer:"}
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                        ${offerAmount}
                    </span>
                </div>
            </div>

            {offer.message && (
                <div className="mb-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">
                        {isReceived ? "Message:" : "Your Message:"}
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        {offer.message}
                    </p>
                </div>
            )}

            {isReceived && offer.status === "pending" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4 mr-2" />
                        )}
                        Accept
                    </Button>
                    <Button
                        onClick={handleReject}
                        disabled={isProcessing}
                        variant="destructive"
                        className="flex-1"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <X className="w-4 h-4 mr-2" />
                        )}
                        Reject
                    </Button>
                </div>
            )}

            {offer.status === "accepted" && isReceived && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                        onClick={() => router.push("/messages")}
                        className="w-full"
                    >
                        Go to Messages
                    </Button>
                </div>
            )}

            <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                {new Date(offer.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </div>
        </div>
    );
}

