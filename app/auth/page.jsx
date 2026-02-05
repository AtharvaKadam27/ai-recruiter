"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/services/supabaseClient";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Sign up with email and password
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!email || !password || !username) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Create auth user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: username.trim(),
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);

        // If user already registered, try to login instead
        if (
          error.message.includes("already registered") ||
          error.message.includes("User already registered")
        ) {
          toast.info("User exists. Trying to login...");

          // Try to login with the provided credentials
          const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });

          if (loginError) {
            toast.error(
              "Account exists but password is incorrect. Please use Login instead.",
            );
            setIsLogin(true);
          } else if (loginData?.session) {
            // Check if user exists in Users table, if not add them
            const { data: existingUser } = await supabase
              .from("Users")
              .select()
              .eq("email", email.trim())
              .single();

            if (!existingUser) {
              await supabase
                .from("Users")
                .insert([{ name: username.trim(), email: email.trim() }]);
            }

            toast.success("Login successful!");
            router.push("/dashboard");
          }
          setLoading(false);
          return;
        }

        toast.error(error.message);
        setLoading(false);
        return;
      }

      console.log("Signup response:", data);

      // Check if email is already registered (identities array is empty)
      if (data?.user?.identities?.length === 0) {
        toast.error("This email is already registered. Please login instead.");
        setIsLogin(true);
        setLoading(false);
        return;
      }

      // Add user to Users table
      if (data.user) {
        const { data: insertData, error: dbError } = await supabase
          .from("Users")
          .insert([
            {
              name: username.trim(),
              email: email.trim(),
            },
          ])
          .select();

        if (dbError) {
          console.error("Error adding user to database:", dbError);
        } else {
          console.log("User added to database:", insertData);
        }
      }

      // If session exists, user is logged in (email confirmation disabled)
      if (data?.session) {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        // Email confirmation is required
        toast.success("Account created! Please check your email to verify.");
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setUsername("");
      }
    } catch (error) {
      console.error("Signup catch error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error("Login error:", error);
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email before logging in");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      console.log("Login response:", data);
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login catch error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth`,
        },
      );

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">
            {isLogin ? "Login" : "Signup"}
          </h1>
          {isLogin && <p className="text-gray-600 mt-1">Welcome back!</p>}
        </div>

        {/* Form */}
        <form
          onSubmit={isLogin ? handleLogin : handleSignUp}
          className="space-y-4"
        >
          {/* Username - Only for Signup */}
          {!isLogin && (
            <div>
              <Input
                type="text"
                placeholder="Enter Your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot Password - Only for Login */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:underline text-sm"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Signup"}
          </Button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
                setUsername("");
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              {isLogin ? "Signup" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
