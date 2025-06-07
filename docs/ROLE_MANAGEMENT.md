# Role Management System

This document outlines how the role management system works in the Kri8tive Blanks application.

## Overview

The application supports different user roles, primarily:

- **Customer (user)**: Regular users who can browse the store and make purchases
- **Shop Manager**: Users who can manage store inventory, track orders, etc.

## Role Attributes

User roles are stored in the Appwrite database with the following attributes:

- `role`: The user's role ('user' or 'shop_manager')
- `status`: The account status ('active', 'pending', 'suspended')

## Registration Process

1. **Regular Users**:
   - Register with the "Customer" role option
   - Account is immediately set to 'active' status after email verification
   - Can access customer features after email verification

2. **Shop Managers**:
   - Register with the "Shop Manager" role option
   - Account is set to 'pending' status after email verification
   - Must be approved by an administrator before accessing shop management features
   - Receive a notification on the registration success page about pending approval

## Approval Process

Shop manager approval is handled through a command-line script:

```bash
# Check pending shop manager accounts
npm run appwrite:check-roles

# Approve a specific user
npm run appwrite:check-roles -- --approve <user_id>
```

## Implementation Details

### Registration Component

The registration form in `SignUpForm.tsx` allows users to select their role. This information is passed to the `AuthContext` for processing.

### Auth Context

The `AuthContext.tsx` handles creating the user account and setting up the appropriate role and status in the database.

### Registration Success Page

The `RegistrationSuccess.tsx` page shows different information based on the user's role:
- Regular users see a standard verification message
- Shop managers see an additional message about pending approval

### Role Management Script

The `scripts/handle-role-permissions.js` script allows administrators to:
1. View all pending shop manager accounts
2. Approve shop manager accounts to change their status from 'pending' to 'active'

## Setting Up

To set up the role management system:

1. Ensure the required attributes exist in the database:
   ```bash
   npm run appwrite:profile-attributes
   ```

2. Check for pending shop manager accounts:
   ```bash
   npm run appwrite:check-roles
   ```

## Security Considerations

- Shop manager functionality should be protected by checking both the user's role AND status
- Always verify that the user's status is 'active' before allowing access to restricted features
- Frontend permissions should be complemented by backend permissions checks 