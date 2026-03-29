#!/usr/bin/env python3
"""
Supabase Admin User Setup Script
Setup admin user for Reelanylizer

Usage:
    python setup-admin.py
    
Requirements:
    pip install supabase python-dotenv
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(".env.local")

try:
    from supabase import create_client
except ImportError:
    print("❌ Missing dependencies!")
    print("Install with: pip install supabase python-dotenv")
    sys.exit(1)

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

ADMIN_EMAIL = "owsmboy7383@gmail.com"
ADMIN_PASSWORD = "Aman@73550"

def validate_credentials():
    """Validate Supabase credentials"""
    if not SUPABASE_URL:
        print("❌ Missing VITE_SUPABASE_URL")
        print("   Set it in your .env file or export it:")
        print("   export VITE_SUPABASE_URL='your-url'")
        return False
    
    if not SUPABASE_SERVICE_KEY:
        print("❌ Missing SUPABASE_SERVICE_KEY")
        print("   Set it in your .env file or export it:")
        print("   export SUPABASE_SERVICE_KEY='your-service-key'")
        return False
    
    return True

def setup_admin():
    """Setup admin user in Supabase"""
    if not validate_credentials():
        sys.exit(1)
    
    try:
        print("🔐 Setting up admin user...\n")
        
        # Create Supabase client with service key
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Create admin user
        print(f"📧 Creating user: {ADMIN_EMAIL}")
        user_response = supabase.auth.admin.create_user({
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "email_confirm": True
        })
        
        user_id = user_response.user.id
        print(f"✅ User created: {user_id}\n")
        
        # Assign admin role
        print(f"🔑 Assigning admin role...")
        role_response = supabase.table("user_roles").insert({
            "user_id": user_id,
            "role": "admin"
        }).execute()
        
        print(f"✅ Admin role assigned\n")
        
        # Print summary
        print("=" * 60)
        print("✨ ADMIN SETUP COMPLETE!")
        print("=" * 60)
        print(f"📧 Email:    {ADMIN_EMAIL}")
        print(f"🔒 Password: {ADMIN_PASSWORD}")
        print(f"🆔 User ID:  {user_id}")
        print("=" * 60)
        print(f"\n🚀 Login at: http://localhost:8080/bosspage-login")
        print(f"📊 Dashboard: http://localhost:8080/bosspage\n")
        
        return True
        
    except Exception as e:
        error_msg = str(e)
        
        if "already exists" in error_msg:
            print("⚠️  User already exists!")
            print("   You can login with the existing credentials")
            print(f"   Email: {ADMIN_EMAIL}")
            print(f"   Password: {ADMIN_PASSWORD}")
            return True
        else:
            print(f"❌ Error: {error_msg}")
            return False

if __name__ == "__main__":
    success = setup_admin()
    sys.exit(0 if success else 1)
