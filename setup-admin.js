/**
 * Admin Setup Script
 * This script creates an admin user in Supabase
 * Run with: node setup-admin.js
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials!");
  console.error("Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const adminEmail = "owsmboy7383@gmail.com";
const adminPassword = "Aman@73550";

async function setupAdmin() {
  try {
    console.log("🔐 Setting up admin user...");

    // Create admin user via Auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already exists")) {
        console.log("⚠️  Admin user already exists, attempting to update...");
        
        // Find existing user
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;
        
        const existingUser = userData.users.find((u) => u.email === adminEmail);
        if (!existingUser) {
          throw new Error("User not found and could not be created");
        }
        authData.user = existingUser;
      } else {
        throw authError;
      }
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error("Failed to get user ID");
    }

    console.log(`✅ Admin user created/found: ${userId}`);

    // Check if admin role already exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (existingRole && existingRole.length > 0) {
      console.log("✅ Admin role already assigned");
    } else {
      // Insert admin role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });

      if (roleError) throw roleError;
      console.log("✅ Admin role assigned");
    }

    console.log("\n✨ Admin Setup Complete!");
    console.log("📧 Email: " + adminEmail);
    console.log("🔒 Password: " + adminPassword);
    console.log("\n🚀 Login at: http://localhost:8080/bosspage-login");
  } catch (error) {
    console.error("❌ Admin setup failed:", error.message);
    process.exit(1);
  }
}

setupAdmin();
