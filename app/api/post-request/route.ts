import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productName, description, price } = body;

        // Validate input
        if (!productName || typeof productName !== "string" || productName.trim().length === 0) {
            return NextResponse.json(
                { error: "Product name is required" },
                { status: 400 }
            );
        }

        if (!description || typeof description !== "string" || description.trim().length === 0) {
            return NextResponse.json(
                { error: "Product description is required" },
                { status: 400 }
            );
        }

        if (!price || typeof price !== "number" || price <= 0) {
            return NextResponse.json(
                { error: "Valid price is required" },
                { status: 400 }
            );
        }

        // Ensure user exists in database (upsert)
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

        // Convert price from dollars to cents (since schema expects Int)
        const priceInCents = Math.round(price * 100);

        // Verify product model is available
        if (!prisma.product) {
            console.error("Prisma product model is not available. Please restart the dev server after running 'npx prisma generate'");
            return NextResponse.json(
                { error: "Database configuration error. Please restart the server." },
                { status: 500 }
            );
        }

        // Save product to database
        const product = await prisma.product.create({
            data: {
                name: productName.trim(),
                price: priceInCents,
                description: description.trim(),
                userId: user.id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Request posted successfully",
                data: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    createdAt: product.createdAt,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error posting request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


