/**
 * Script to help add ngrok domain to Appwrite Console
 * This provides instructions for manually adding the domain
 */

const ngrokUrl = 'https://51e1-169-150-218-59.ngrok-free.app';

console.log(`
🔧 NGROK DOMAIN SETUP INSTRUCTIONS
═══════════════════════════════════════════════════════════════

To fix the "Failed to fetch" errors when using ngrok, you need to add 
your ngrok URL to Appwrite Console's allowed domains.

📋 STEP-BY-STEP INSTRUCTIONS:

1. 🌐 Open Appwrite Console:
   https://cloud.appwrite.io/console

2. 🔑 Login to your account

3. 📁 Select your project:
   Project ID: 67ea2c3b00309b589901

4. ⚙️ Go to Settings → Domains

5. ➕ Add new domain:
   Domain: ${ngrokUrl}

6. 💾 Save the changes

7. 🔄 Refresh your ngrok application:
   ${ngrokUrl}

═══════════════════════════════════════════════════════════════

🚨 IMPORTANT NOTES:

• This ngrok URL changes every time you restart ngrok
• You'll need to update the domain in Appwrite Console each time
• For production, use a permanent domain instead of ngrok

🔧 ALTERNATIVE SOLUTIONS:

• Use localhost for development: http://localhost:5173
• Use a permanent tunnel service like Cloudflare Tunnel
• Deploy to a permanent hosting service

═══════════════════════════════════════════════════════════════
`);

// Also provide a quick copy-paste for the domain
console.log(`\n📋 Quick copy-paste for Appwrite Console:`);
console.log(`Domain to add: ${ngrokUrl}`);
console.log(`\n🔗 Direct link to Appwrite Console:`);
console.log(`https://cloud.appwrite.io/console/project-67ea2c3b00309b589901/settings/domains`); 