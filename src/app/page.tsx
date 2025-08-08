import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // If user is admin, redirect to admin dashboard
  if (session.user.role === "admin") {
    redirect("/admin/dashboard");
  }

  // For regular users, redirect to family tree view
  redirect("/family-tree");
}
