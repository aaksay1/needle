import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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

        // TODO: Save to database
        // For now, we'll just return success
        // You can integrate with your database here (e.g., Prisma, MongoDB, etc.)
        
        const requestData = {
            productName: productName.trim(),
            description: description.trim(),
            price: price,
            userId: user.id,
            userEmail: user.email,
            createdAt: new Date().toISOString(),
        };

        // Example: Save to database
        // await db.productRequests.create({ data: requestData });

        return NextResponse.json(
            {
                success: true,
                message: "Request posted successfully",
                data: requestData,
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


