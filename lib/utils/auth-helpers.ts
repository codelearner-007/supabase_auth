import { createClient } from "@/utlis/supabase/client";
import { log } from "console";

// verifyOtp function
export async function verifyOtp(email: string, otp: string) {
  const supabase = createClient();

  const isPasswordReset = sessionStorage.getItem("isPasswordReset") == "true";

  const { data, error } = await supabase.auth.verifyOtp({
    token: otp,
    email,
    type: isPasswordReset ? "recovery" : "email",
  });

  if (error) throw error;
  console.log("data..", data);
  return data;
}

// login function
export async function login(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  console.log("data..", data);

  return data;
}

// logout function
export async function logout() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

// updatePassword function
export async function updatePassword(password: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
}
