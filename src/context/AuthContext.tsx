import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import emailjs from "@emailjs/browser";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) throw resetError;

      // Send password reset email using EmailJS
      const templateParams = {
        title: "Reset your password",
        to_email: email,
        customer_email: email,
        message: `You have requested to reset your password for your Vitanic account.

Please check your email for a password reset link from Supabase.

If you did not request this password reset, please ignore this email.

For security reasons, this link will expire in 24 hours.`,
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send reset password email"
      );
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign in");
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      setError(null);
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: signUpData.user.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
          },
        ]);

        if (profileError) throw profileError;

        await sendWelcomeEmail(email, firstName);
        return { success: true };
      }

      throw new Error("Failed to create user");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign up");
      return { success: false };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      if (!session) return; // Don't attempt to sign out if there's no session
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (error) {
      console.error("Sign out error:", error);
      // Don't throw or set error here - just log it
    } finally {
      // Clear local state regardless of success/failure
      setUser(null);
      setSession(null);
    }
  };

  const sendWelcomeEmail = async (email: string, firstName: string) => {
    try {
      const templateParams = {
        title: "Welcome to Vitanic!",
        to_email: email,
        customer_email: email,
        customer_name: firstName,
        message: `
We're excited to have you join our community. Here's what you can do now:
- Browse our curated collection of wellness products
- Add items to your cart
- Use promotion codes for special discounts
- Track your orders

Thank you for choosing Vitanic for your wellness journey.`,
        copy_email: import.meta.env.VITE_COPY_EMAIL || "",
      };

      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.error("Missing required EmailJS configuration");
        return;
      }

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signIn,
        signUp,
        signOut,
        resetPassword,
        loading,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
