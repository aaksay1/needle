"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/app/lib/schemas";
import { getLatLonFromZip } from "@/app/lib/geo";

export async function SellProduct(formData: FormData) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Something went wrong");
    }

    const validateFields = productSchema.safeParse({
        name: formData.get("name"),
        price: formData.get("price"),
        description: formData.get("description"),
        zipCode: formData.get("zipCode"), // added
    });

    if (!validateFields.success) {
        throw new Error("Invalid product data");
    }

    const { name, price, description, zipCode } = validateFields.data;

    await prisma.product.create({
        data: {
            name: name.trim(),
            description: description.trim(),
            price: Math.round(price * 100),
            zipCode: zipCode.trim(),
            userId: user.id,
        },
    });

    revalidatePath("/my-requests");
    return { success: true };
}

export async function updateProduct(
    productId: string,
    data: { name: string; description: string; price: number; zipCode: string }
) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) throw new Error("Unauthorized");

    if (!data.zipCode || !data.zipCode.trim()) {
        throw new Error("ZIP code is required");
    }

    // Lookup new geo coordinates
    const geo = await getLatLonFromZip(data.zipCode.trim());
    if (!geo) throw new Error("Invalid ZIP code");

    // Verify product belongs to user
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");
    if (product.userId !== user.id) throw new Error("Unauthorized");

    const priceInCents = Math.round(data.price * 100);

    await prisma.product.update({
        where: { id: productId },
        data: {
            name: data.name.trim(),
            description: data.description.trim(),
            price: priceInCents,
            zipCode: data.zipCode.trim(),
            latitude: geo.latitude,
            longitude: geo.longitude,
        },
    });

    revalidatePath("/my-requests");
    return { success: true };
}

export async function deleteProduct(productId: string) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    if (product.userId !== user.id) {
        throw new Error("Unauthorized: You can only delete your own requests");
    }

    await prisma.product.delete({
        where: { id: productId },
    });

    revalidatePath("/my-requests");
    return { success: true };
}

export async function createOffer(
    productId: string,
    amount: number,
    message?: string
) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
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

    // Verify product exists and get the product owner's email
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            User: {
                select: {
                    email: true,
                },
            },
        },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    // Don't allow users to make offers on their own products (check by email)
    const userEmail = user.email?.toLowerCase().trim();
    const productOwnerEmail = product.User?.email?.toLowerCase().trim();
    
    if (userEmail && productOwnerEmail && userEmail === productOwnerEmail) {
        throw new Error("You cannot make an offer on your own product");
    }

    // Create the offer
    await prisma.offer.create({
        data: {
            productId: productId,
            senderId: user.id,
            amount: Math.round(amount * 100), // Convert to cents
            message: message?.trim() || null,
            status: "pending",
        },
    });

    revalidatePath("/my-offers");
    return { success: true };
}

export async function acceptOffer(offerId: string) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get the offer with product and sender info
    const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
            product: {
                include: {
                    User: true,
                },
            },
            sender: true,
        },
    });

    if (!offer) {
        throw new Error("Offer not found");
    }

    // Verify the user owns the product
    if (offer.product.userId !== user.id) {
        throw new Error("Unauthorized: You can only accept offers on your own products");
    }

    // Check if offer is still pending
    if (offer.status !== "pending") {
        throw new Error("Offer has already been processed");
    }

    // Update offer status to accepted
    await prisma.offer.update({
        where: { id: offerId },
        data: { status: "accepted" },
    });

    // Create or get conversation between the two users
    const user1Id = user.id;
    const user2Id = offer.senderId;
    
    // Ensure both users exist in database
    await prisma.user.upsert({
        where: { id: offer.senderId },
        update: {},
        create: {
            id: offer.senderId,
            email: offer.sender.email || "",
            firstName: offer.sender.firstName || "",
            lastName: offer.sender.lastName || "",
            profileImage: offer.sender.profileImage || `https://avatar.vercel.sh/${offer.sender.firstName}`,
        },
    });

    // Create conversation (order users by ID to ensure consistency)
    const [smallerId, largerId] = [user1Id, user2Id].sort();

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
        where: {
            AND: [
                {
                    OR: [
                        { user1Id: smallerId, user2Id: largerId },
                        { user1Id: largerId, user2Id: smallerId },
                    ],
                },
                { offerId: offerId },
            ],
        },
    });

    if (!conversation) {
        try {
            conversation = await prisma.conversation.create({
                data: {
                    user1Id: smallerId,
                    user2Id: largerId,
                    offerId: offerId,
                },
            });
        } catch (error: any) {
            // If creation fails due to unique constraint, try to find it again
            console.error("Error creating conversation:", error);
            conversation = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        {
                            OR: [
                                { user1Id: smallerId, user2Id: largerId },
                                { user1Id: largerId, user2Id: smallerId },
                            ],
                        },
                        { offerId: offerId },
                    ],
                },
            });
            if (!conversation) {
                // If still not found, try without offerId constraint (in case offerId is null somehow)
                conversation = await prisma.conversation.findFirst({
                    where: {
                        OR: [
                            { user1Id: smallerId, user2Id: largerId },
                            { user1Id: largerId, user2Id: smallerId },
                        ],
                    },
                });
                if (!conversation) {
                    throw new Error(`Failed to create or find conversation: ${error.message}`);
                }
            }
        }
    }

    // Create the first message from the offer's message
    // The sender is the person who made the offer (offer.senderId)
    const initialMessage = offer.message && offer.message.trim() 
        ? offer.message.trim() 
        : "I'd like to discuss this offer with you.";
    
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            senderId: offer.senderId,
            content: initialMessage,
        },
    });
    
    // Update conversation updatedAt
    await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
    });

    revalidatePath("/my-offers");
    revalidatePath("/messages");
    return { success: true, conversationId: conversation.id };
}

export async function rejectOffer(offerId: string) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get the offer with product info
    const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
            product: true,
        },
    });

    if (!offer) {
        throw new Error("Offer not found");
    }

    // Verify the user owns the product
    if (offer.product.userId !== user.id) {
        throw new Error("Unauthorized: You can only reject offers on your own products");
    }

    // Check if offer is still pending
    if (offer.status !== "pending") {
        throw new Error("Offer has already been processed");
    }

    // Delete the offer
    await prisma.offer.delete({
        where: { id: offerId },
    });

    revalidatePath("/my-offers");
    return { success: true };
}