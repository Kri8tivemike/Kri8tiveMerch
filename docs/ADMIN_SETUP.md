# Admin Account Setup

This document outlines how to set up and manage admin accounts in the Kri8tive Blanks application.

## Account Types

The application supports different admin roles:

- **Super Admin**: Has full access to all administrative functions and can manage other admin accounts
- **Shop Manager**: Has limited administrative access to manage store inventory and orders

## Creating a Super Admin Account

There are two methods to create a super admin account:

### Method 1: Using the Command Line Script (Recommended)

This is the easiest and most secure way to create an admin account:

1. First, register a normal user account through the application's signup form
2. Verify your email address by clicking the verification link
3. Run the admin creation script:

```bash
npm run appwrite:create-admin
```

4. Enter the email address of the account you registered
5. Confirm the action when prompted
6. The script will update the user's role to 'super_admin' and set their status to 'active'

### Method 2: Manual Update via Appwrite Console

If you have direct access to the Appwrite Console, you can manually update a user:

1. Register a normal user account through the application's signup form
2. Verify your email address by clicking the verification link
3. Log in to your Appwrite Console
4. Navigate to Databases → Your Database → Collections → user_profiles
5. Find the document for your user account (search by email)
6. Edit the document to update:
   - Set `role` to `super_admin`
   - Set `status` to `active`
7. Save the changes

## Accessing the Admin Portal

Once your account has been set up with the super_admin role:

1. Navigate to `/admin-login` in the application
2. Enter your email and password
3. If your role and status are correctly set, you'll be redirected to the admin dashboard

## Security Considerations

- Super admin accounts should be created sparingly and only for trusted personnel
- The admin login page is intentionally at a different URL for added security
- All login attempts to the admin portal are logged for security monitoring
- Regularly audit the list of users with admin privileges

## Troubleshooting

If you encounter issues logging in to the admin portal:

1. Ensure your account has been verified (check your email)
2. Confirm your role is set to 'super_admin' in the database
3. Verify your account status is 'active'
4. Check the browser console for any error messages
5. Try clearing your browser cache and cookies 

## Troubleshooting the Admin Creation Script

If you encounter issues with the `appwrite:create-admin` script:

### "No user found with that email address" error

1. Make sure you've registered an account with the email address you're trying to promote
2. Ensure you've verified your email address by clicking the link sent to your inbox
3. Check that you're using the exact same email address you used during registration (case sensitive)
4. Confirm your environment variables are correctly set up with the right database and collection IDs

### Node.js Module Type Warning

If you see a warning about module type:

```
Warning: Module type of file is not specified and it doesn't parse as CommonJS.
```

Run these commands to fix it:

```bash
# Create or update the package.json in the scripts directory
echo '{"type": "module"}' > scripts/package.json

# Then run the admin creation script again
npm run appwrite:create-admin
```

### Connection Errors

If the script can't connect to Appwrite:

1. Make sure your Appwrite server is running
2. Verify your API keys in the `.env` file
3. Check that your firewall isn't blocking connections to the Appwrite server
4. Ensure your `VITE_APPWRITE_ENDPOINT` points to the correct URL 