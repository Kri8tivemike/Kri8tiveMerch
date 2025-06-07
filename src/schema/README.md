# Customization System Database Schema

This directory contains scripts to set up and manage the database schema for the Kri8tive Blanks customization system. The system has been migrated from Supabase to Appwrite, and these scripts help establish the necessary collections and attributes.

## Schema Overview

The customization system consists of the following collections:

1. **customization_requests** - Stores customer customization requests
2. **techniques** - Available printing/customization techniques
3. **fabric_qualities** - Different fabric quality options with costs
4. **sizes** - Size-based pricing information

## Setting Up the Database

To set up the entire customization system database, follow these steps:

### Prerequisites

1. Install Node.js if you haven't already
2. Make sure you have an Appwrite account and project set up
3. Create an API key with the following permissions:
   - databases.read
   - databases.write
   - documents.read
   - documents.write
   - collections.read
   - collections.write

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_API_KEY=your-api-key
VITE_APPWRITE_DATABASE_ID=kri8tive_db
VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID=customization_requests
VITE_APPWRITE_PROFILES_COLLECTION_ID=profiles
VITE_APPWRITE_STORAGE_BUCKET_ID=product-images
```

### Running the Setup Script

Run the following command to set up the entire database schema:

```bash
node src/schema/init-customization-schema.js
```

This script will:
1. Create the database if it doesn't exist
2. Create all collections with proper attributes
3. Set up indexes for efficient querying
4. Configure permissions for each collection

## Collection Structure

### customization_requests

This collection stores all customer customization requests with the following key attributes:

- `user_id`: ID of the user making the request
- `user_name`, `user_email`: Customer contact information
- `phone_number`, `whatsapp_number`, `delivery_address`: Delivery details
- `title`, `description`: Basic request information
- `product_id`, `item_type`, `size`, `color`: Product details
- `technique_id`, `technique_name`: Printing technique information
- `material`, `fabric_quality`: Material specifications
- `technique_cost`, `fabric_cost`, `unit_cost`, `total_cost`: Pricing details
- `quantity`: Number of items
- `status`: Current status (pending, approved, rejected, completed)
- `design_url`, `image_url`: Design assets
- `notes`, `admin_notes`: Additional information
- `payment_reference`, `payment_completed`: Payment tracking

### techniques

This collection stores available printing techniques with their costs:

- `name`: Name of the technique (e.g., Screen Printing, DTG, Embroidery)
- `description`: Details about the technique
- `cost`: Base cost for this technique
- `design_area`: Available printing area
- `available`: Whether this technique is currently available
- `image_url`: Sample image of the technique

### fabric_qualities

This collection stores different fabric quality options:

- `quality`: GSM (grams per square meter) rating
- `cost`: Cost per unit for this quality
- `description`: Description of the fabric quality

### sizes

This collection stores size-based pricing:

- `size`: Size name (S, M, L, XL, etc.)
- `cost`: Additional cost for this size

## Permissions

- **customization_requests**: Users can create and read their own requests, admins can read and manage all requests
- **techniques**, **fabric_qualities**, **sizes**: Public read access, admin-only write access

## Troubleshooting

If you encounter issues running the setup script:

1. Check that your API key has the correct permissions
2. Verify that the environment variables are set correctly
3. Check the Appwrite console for any error messages
4. Make sure you don't have name conflicts with existing collections 