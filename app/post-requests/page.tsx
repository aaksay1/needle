import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { PostRequestForm } from "./PostRequestForm";

export default async function PostRequestPage() {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        redirect("/api/auth/login?post_login_redirect_url=/post-requests");
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-8 md:p-10">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Post a Product Request
                        </h1>
                        <p className="text-gray-600">
                            Tell sellers what you need and how much you're willing to pay
                        </p>
                    </div>
                    <PostRequestForm />
                </div>
            </div>
        </div>
    );
}
