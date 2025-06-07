/**
 * Troubleshooting Guide for Appwrite Connectivity Issues
 * 
 * This utility provides step-by-step troubleshooting instructions for common
 * connectivity problems with Appwrite.
 */

interface TroubleshootingStep {
  step: number;
  title: string;
  description: string;
  action?: string;
  command?: string;
}

class TroubleshootingGuide {
  /**
   * Display comprehensive troubleshooting guide
   */
  showTroubleshootingGuide(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    APPWRITE CONNECTIVITY TROUBLESHOOTING GUIDE               ║
╚══════════════════════════════════════════════════════════════════════════════╝

🚨 You're experiencing "Failed to fetch" errors with Appwrite. Here's how to fix them:

┌─ STEP 1: CHECK INTERNET CONNECTION ─────────────────────────────────────────┐
│ • Open a new browser tab and visit https://www.google.com                   │
│ • If this fails, check your internet connection                             │
│ • Try restarting your router/modem                                          │
│ • Contact your ISP if internet is completely down                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 2: VERIFY APPWRITE CLOUD STATUS ─────────────────────────────────────┐
│ • Visit https://cloud.appwrite.io in a new tab                             │
│ • If the page doesn't load, Appwrite Cloud might be down                   │
│ • Check Appwrite's status page or social media for outage reports          │
│ • Wait for service restoration if there's an outage                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 3: CHECK ENVIRONMENT VARIABLES ──────────────────────────────────────┐
│ Run this command in the console:                                           │
│ > checkEnvVars()                                                           │
│                                                                             │
│ If variables are missing:                                                   │
│ • Check your .env file in the project root                                 │
│ • Ensure it contains the correct Appwrite configuration                    │
│ • Restart your development server after making changes                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 4: CLEAR DNS CACHE AND BROWSER DATA ─────────────────────────────────┐
│ Run this command in the console:                                           │
│ > fixDNSIssues()                                                           │
│                                                                             │
│ Additionally, try these manual steps:                                       │
│ • Clear your browser cache and cookies                                     │
│ • Try opening the app in an incognito/private window                       │
│ • Flush your system DNS cache:                                             │
│   - Windows: Open Command Prompt as admin, run: ipconfig /flushdns         │
│   - Mac: sudo dscacheutil -flushcache                                      │
│   - Linux: sudo systemctl restart systemd-resolved                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 5: CHECK CORS CONFIGURATION ─────────────────────────────────────────┐
│ Run this command in the console:                                           │
│ > fixCORSIssues()                                                          │
│                                                                             │
│ This will provide instructions to:                                         │
│ • Add your current domain to Appwrite Console                             │
│ • Configure proper CORS settings                                          │
│ • Add development URLs for local testing                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 6: RESET APPWRITE CLIENT ────────────────────────────────────────────┐
│ Run this command in the console:                                           │
│ > resetAppwriteClient()                                                    │
│                                                                             │
│ This will:                                                                 │
│ • Clear stored session data                                               │
│ • Recreate the Appwrite client with fresh configuration                   │
│ • Reset any cached connection state                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 7: CHECK FIREWALL AND ANTIVIRUS ─────────────────────────────────────┐
│ • Temporarily disable your firewall/antivirus                             │
│ • Try accessing the app again                                             │
│ • If it works, add an exception for your browser or the app               │
│ • Re-enable your security software                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 8: TRY DIFFERENT NETWORK ────────────────────────────────────────────┐
│ • Try connecting via mobile hotspot                                        │
│ • Use a different WiFi network if available                               │
│ • If it works on different network, contact your ISP                      │
│ • Your network might be blocking cloud.appwrite.io                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 9: RUN COMPREHENSIVE DIAGNOSTICS ────────────────────────────────────┐
│ Run this command in the console:                                           │
│ > runNetworkDiagnostics()                                                 │
│                                                                             │
│ This will test:                                                            │
│ • Internet connectivity                                                    │
│ • DNS resolution                                                          │
│ • Appwrite endpoint accessibility                                         │
│ • CORS configuration                                                      │
│ • Database connectivity                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STEP 10: RUN ALL AUTOMATED FIXES ─────────────────────────────────────────┐
│ Run this command in the console:                                           │
│ > fixConnectivityIssues()                                                 │
│                                                                             │
│ This will automatically:                                                   │
│ • Check environment variables                                             │
│ • Clear DNS cache and service workers                                    │
│ • Provide CORS configuration instructions                                │
│ • Reset Appwrite client configuration                                    │
└─────────────────────────────────────────────────────────────────────────────┘

🔧 QUICK COMMANDS REFERENCE:
  • checkEnvVars() - Check environment variables
  • fixDNSIssues() - Clear DNS cache and browser data
  • fixCORSIssues() - Get CORS configuration help
  • resetAppwriteClient() - Reset Appwrite client
  • runNetworkDiagnostics() - Run comprehensive tests
  • fixConnectivityIssues() - Run all automated fixes
  • quickConnectivityCheck() - Quick connection test

💡 ADDITIONAL TIPS:
  • Always refresh the page after making configuration changes
  • Check browser developer tools Network tab for specific error details
  • Try different browsers to isolate browser-specific issues
  • Contact Appwrite support if issues persist after trying all steps

🆘 STILL HAVING ISSUES?
  • Check Appwrite Discord: https://discord.gg/GSeTUeA
  • Visit Appwrite Documentation: https://appwrite.io/docs
  • Create an issue on GitHub: https://github.com/appwrite/appwrite/issues
    `);
  }

  /**
   * Show quick fix suggestions for common errors
   */
  showQuickFixes(): void {
    console.log(`
🚀 QUICK FIXES FOR COMMON APPWRITE ERRORS:

❌ "Failed to fetch" Error:
   → Run: fixConnectivityIssues()
   → Check internet connection
   → Clear browser cache

❌ CORS Error:
   → Run: fixCORSIssues()
   → Add your domain to Appwrite Console
   → Check Settings → Domains in Appwrite

❌ "Project not found" Error:
   → Run: checkEnvVars()
   → Verify VITE_APPWRITE_PROJECT_ID in .env
   → Check project exists in Appwrite Console

❌ "Database not found" Error:
   → Run: checkEnvVars()
   → Verify VITE_APPWRITE_DATABASE_ID in .env
   → Check database exists in Appwrite Console

❌ DNS Resolution Error:
   → Run: fixDNSIssues()
   → Flush system DNS cache
   → Try different DNS servers (8.8.8.8, 8.8.4.4)

❌ Timeout Errors:
   → Check internet speed
   → Try different network
   → Contact ISP if persistent
    `);
  }

  /**
   * Show network-specific troubleshooting
   */
  showNetworkTroubleshooting(): void {
    console.log(`
🌐 NETWORK-SPECIFIC TROUBLESHOOTING:

🏢 CORPORATE/OFFICE NETWORKS:
   • Your company firewall might block cloud.appwrite.io
   • Ask IT to whitelist *.appwrite.io domains
   • Try using mobile hotspot as alternative
   • Check if proxy settings are interfering

🏠 HOME NETWORKS:
   • Router might have strict security settings
   • Try restarting your router
   • Check if parental controls are blocking the site
   • Update router firmware if outdated

📱 MOBILE NETWORKS:
   • Some carriers block certain cloud services
   • Try switching between WiFi and mobile data
   • Check if data saver mode is enabled
   • Contact carrier if issues persist

🔒 VPN/PROXY ISSUES:
   • Disable VPN temporarily to test
   • Try different VPN server locations
   • Check if proxy settings are correct
   • Some VPNs block cloud services

🌍 GEOGRAPHIC RESTRICTIONS:
   • Some countries/regions may restrict access
   • Try using a VPN to different location
   • Check local internet regulations
   • Contact Appwrite support for region-specific help
    `);
  }
}

// Create global instance
const troubleshootingGuide = new TroubleshootingGuide();

// Export functions to global scope for console access
declare global {
  interface Window {
    showTroubleshootingGuide: () => void;
    showQuickFixes: () => void;
    showNetworkTroubleshooting: () => void;
    troubleshootingGuide: TroubleshootingGuide;
  }
}

// Make functions available globally
window.showTroubleshootingGuide = () => troubleshootingGuide.showTroubleshootingGuide();
window.showQuickFixes = () => troubleshootingGuide.showQuickFixes();
window.showNetworkTroubleshooting = () => troubleshootingGuide.showNetworkTroubleshooting();
window.troubleshootingGuide = troubleshootingGuide;

console.log('📚 Troubleshooting guide loaded:');
console.log('  - showTroubleshootingGuide() - Complete troubleshooting guide');
console.log('  - showQuickFixes() - Quick fixes for common errors');
console.log('  - showNetworkTroubleshooting() - Network-specific help');

export { troubleshootingGuide, TroubleshootingGuide }; 