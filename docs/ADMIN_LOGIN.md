# Admin Login Guide

## Accessing the Admin Portal

The admin portal is available at: `http://localhost:5173/admin-login`

## Login Steps

1. Navigate to the admin login URL
2. Enter your email and password
3. Click "Access Secure Portal"

## Common Issues and Solutions

### "Unauthorized: This area is restricted to administrators only"

This error occurs when your account does not have the correct role.

**Solution:**
1. Make sure your account has the `super_admin` role by running:
   ```
   npm run appwrite:list-users
   ```
2. If your role is not `super_admin`, update it with:
   ```
   npm run appwrite:create-admin
   ```
3. Follow the prompts to enter your email and confirm the change

### "Your admin account is not active"

This error occurs when your account has the `super_admin` role but the status is not set to `active`.

**Solution:**
1. Update your account status by running:
   ```
   npm run appwrite:create-admin
   ```
2. The script will set both your role to `super_admin` AND your status to `active`

### "No profile found for this user account"

This error means you have an Appwrite account but no matching profile in the database.

**Solution:**
1. Register through the normal signup process
2. Verify your email
3. Then use the admin creation script

### Connection Issues

If the login page cannot connect to Appwrite:

1. Ensure Appwrite is running
2. Check your API keys in the `.env` file
3. Look at the browser console for specific error messages

## Quick Commands Reference

```bash
# List all users
npm run appwrite:list-users

# Promote a user to super_admin
npm run appwrite:create-admin

# Check for shop managers awaiting approval
npm run appwrite:check-roles

# Approve a shop manager
npm run appwrite:check-roles -- --approve <user_id>
``` 