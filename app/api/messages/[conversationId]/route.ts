import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return NextResponse.json(messages);
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
        return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId: user.id,
            content: content.trim(),
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                },
            },
        },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
}

