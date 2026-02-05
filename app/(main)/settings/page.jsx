"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { UserDetailContext } from "@/context/UserDetailContext";
import { toast } from "sonner";
import { useState, useContext } from "react";
import { LogOut, ArrowLeft, Settings } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useContext(UserDetailContext);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error logging out");
        console.error("Logout error:", error);
      } else {
        toast.success("Logged out successfully");
        router.push("/auth");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error("Logout catch error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fbff] to-[#f0f4ff] text-gray-900 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {user?.name || "User"}
              </h2>
              <p className="text-gray-500">{user?.email || "No email"}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
