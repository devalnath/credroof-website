/* CredRoof site config.
   Edit this file only. Every page reads it.

   Before going live:
   1. Set whatsapp to the sales line in international format, digits only.
      Example: 919876543210 for +91 98765 43210.
   2. Confirm the business name, address and grievance contact with the founders.
   3. Leave formEndpoint empty unless a CRM or form service is connected.
   4. Replace [LENDER NAME] and [REGISTERED NAME] placeholders in the page copy
      only after the founder answers in ops/02-FOUNDER-QUESTIONS.md are in. */

window.CREDROOF_CONFIG = {
  bizName: "CredRoof",
  // Sales line, international format, digits only. Example: 919876543210
  // Leave empty to keep the site in demo mode: call buttons point to the form
  // and the WhatsApp message is displayed instead of sent.
  whatsapp: "918848326840",
  // Shown on the call buttons and in the footer. Example: "+91 98765 43210"
  phone: "+91 88483 26840",
  email: "hello@credroof.in",
  city: "Thrissur, Kerala",
  formEndpoint: "", // optional POST endpoint for a CRM or form service
  responsePromise: "We confirm a callback time with you."
};
