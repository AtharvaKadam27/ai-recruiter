"use client";
import { UserDetailContext } from "@/context/UserDetailContext";
import { supabase } from "@/services/supabaseClient";
// import { PayPalScriptProvider } from "@paypal/react-paypal-js"; // Disabled - no credentials

import React, { useContext, useEffect, useState, useCallback } from "react";

function Provider({ children }) {
  const [user, setUser] = useState(null);

  // Fetch user data from database
  const fetchUserData = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    // Check if user exists in database
    let { data: Users, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", authUser?.email);

    console.log("Fetched users:", Users);

    if (!Users || Users?.length === 0) {
      // Get name from metadata or email username as fallback
      const userName =
        authUser?.user_metadata?.name ||
        authUser?.user_metadata?.full_name ||
        authUser?.email?.split("@")[0] ||
        "User";

      const { data, error } = await supabase
        .from("Users")
        .insert([
          {
            name: userName,
            email: authUser?.email,
          },
        ])
        .select();

      console.log("Inserted user:", data);
      if (data && data[0]) {
        setUser(data[0]);
      }
      return;
    }
    setUser(Users[0]);
  }, []);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserData(user);
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserData]);

  return (
    // PayPal disabled - uncomment when you have credentials
    // <PayPalScriptProvider
    //   options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}
    // >
    <UserDetailContext.Provider value={{ user, setUser, fetchUserData }}>
      <div>{children}</div>
    </UserDetailContext.Provider>
    // </PayPalScriptProvider>
  );
}

export default Provider;

export const useUser = () => {
  const context = useContext(UserDetailContext);
  return context;
};
