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

    // Emit real-time message via Socket.IO
    try {
        // Access the Socket.IO instance from the global scope (set by server.js)
        // Try both global and process in case one doesn't work
        const io = (global as any).io || (process as any).io;
        if (io) {
            console.log(`Emitting message to conversation:${conversationId}`);
            const messageData = {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
                sender: message.sender,
            };
            
            // Emit to the conversation room
            io.to(`conversation:${conversationId}`).emit('new-message', messageData);
            console.log('Message emitted successfully to room conversation:' + conversationId, messageData);
            
            // Also log how many sockets are in the room (for debugging)
            const room = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
            if (room) {
                console.log(`Room has ${room.size} socket(s)`);
            } else {
                console.warn(`Room conversation:${conversationId} does not exist`);
            }
        } else {
            console.warn('Socket.IO instance not available in API route');
        }
    } catch (error) {
        console.error('Failed to emit socket message:', error);
        // Don't fail the request if socket emission fails
    }

    return NextResponse.json(message);
}

