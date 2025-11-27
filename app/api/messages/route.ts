import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all conversations for this user
    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { user1Id: user.id },
                { user2Id: user.id },
            ],
        },
        include: {
            user1: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                },
            },
            user2: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                },
            },
            offer: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            messages: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    // Transform to include the other user and last message
    const transformedConversations = conversations.map((conv) => {
        const otherUser = conv.user1Id === user.id ? conv.user2 : conv.user1;
        const lastMessage = conv.messages[0] || null;

        // Ensure otherUser exists (should always exist, but safety check)
        if (!otherUser) {
            console.error(`Conversation ${conv.id} has missing user data`);
            return null;
        }

        return {
            id: conv.id,
            otherUser: {
                id: otherUser.id,
                firstName: otherUser.firstName || "Unknown",
                lastName: otherUser.lastName || "User",
                profileImage: otherUser.profileImage || `https://avatar.vercel.sh/${otherUser.firstName || "User"}`,
            },
            product: conv.offer?.product || null,
            lastMessage: lastMessage
                ? {
                      id: lastMessage.id,
                      content: lastMessage.content,
                      senderId: lastMessage.senderId,
                      createdAt: lastMessage.createdAt,
                  }
                : null,
            updatedAt: conv.updatedAt,
        };
    }).filter((conv) => conv !== null); // Filter out any null conversations

    return NextResponse.json(transformedConversations);
}

