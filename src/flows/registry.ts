/**
 * Flow Registry
 *
 * Predefined guided walkthroughs for every major OpenEvent feature.
 * Each flow is a sequence of browser actions with subtitles.
 *
 * Selector conventions:
 * - data-guide="name" attributes are the preferred anchor (add to OpenEvent app)
 * - Fallback: semantic selectors like [aria-label], button text, heading text
 * - Last resort: structural selectors (avoid - fragile)
 */

import type { AgentCommand, Flow, FlowStep } from "../shared/types.js";

// ── Helper to create flow steps ──────────────────────────────────

let stepCounter = 0;
function step(
  description: string,
  command: AgentCommand,
  options?: { waitForUser?: boolean; waitSelector?: string }
): FlowStep {
  stepCounter++;
  // Add subtitle to commands that support it
  const commandWithSubtitle =
    "subtitle" in command || command.type === "subtitle" || command.type === "wait" || command.type === "sequence" || command.type === "clear"
      ? command
      : { ...command, subtitle: description };
  return {
    id: `step-${stepCounter}`,
    action: command.type,
    command: commandWithSubtitle as AgentCommand,
    description,
    ...options,
  };
}

// ── Flows ────────────────────────────────────────────────────────

const flows: Flow[] = [
  // ─── GETTING STARTED ────────────────────────────────────────────
  {
    id: "getting-started",
    name: "Getting Started with OpenEvent",
    description:
      "A quick tour of the main sections of OpenEvent. Learn where everything is.",
    area: "general",
    keywords: [
      "getting started",
      "tour",
      "overview",
      "how does this work",
      "show me around",
      "new here",
      "first time",
      "beginners",
    ],
    steps: [
      step("Welcome to OpenEvent! Let me show you around.", {
        type: "subtitle",
        text: "Welcome to OpenEvent! Let me show you around the main areas of the platform.",
        duration: 4000,
      }),
      step("This is your Dashboard - your daily overview of what's happening.", {
        type: "navigate",
        path: "/updates",
      }),
      step("The sidebar is your main navigation. Let me highlight the key sections.", {
        type: "highlight",
        selector: "nav, [data-guide='sidebar']",
        duration: 3000,
      }),
      step("Events is where you create and manage all your events.", {
        type: "highlight",
        selector: "a[href*='events'], [data-guide='nav-events']",
        duration: 3000,
      }),
      step("Ticketing shows all your ticket links, orders, and reservations.", {
        type: "highlight",
        selector: "a[href*='ticketing'], [data-guide='nav-ticketing']",
        duration: 3000,
      }),
      step("Audience is your marketing hub - clients, campaigns, and automations.", {
        type: "highlight",
        selector: "a[href*='audience'], [data-guide='nav-audience']",
        duration: 3000,
      }),
      step("Payments tracks all your financial activity - invoices, offers, and revenue.", {
        type: "highlight",
        selector: "a[href*='payments'], [data-guide='nav-payments']",
        duration: 3000,
      }),
      step("Settings is where you configure your business, payment processing, and more.", {
        type: "highlight",
        selector: "a[href*='settings'], [data-guide='nav-settings']",
        duration: 3000,
      }),
      step("That's the overview! Ask me about any specific feature to dive deeper.", {
        type: "subtitle",
        text: "That's the overview! Ask me about any specific feature to learn more.",
        duration: 5000,
      }),
    ],
  },

  // ─── EVENTS ─────────────────────────────────────────────────────
  {
    id: "create-event",
    name: "Create Your First Event",
    description: "Step-by-step guide to creating a new event.",
    area: "events",
    keywords: [
      "create event",
      "new event",
      "add event",
      "make event",
      "set up event",
      "first event",
      "Veranstaltung erstellen",
    ],
    steps: [
      step("Let's create your first event! I'll take you to the events page.", {
        type: "navigate",
        path: "/updates",
      }),
      step("Look for the 'Create Event' or '+' button to start.", {
        type: "highlight",
        selector:
          "button[data-guide='create-event'], [aria-label*='Create Event'], [aria-label*='Add Event'], button:has(svg[data-lucide='plus'])",
        duration: 5000,
      }),
      step("Click here to open the event creation form.", {
        type: "click",
        selector:
          "button[data-guide='create-event'], [aria-label*='Create Event'], [aria-label*='Add Event']",
      }),
      step(
        "Give your event a name - something your guests will recognize.",
        {
          type: "highlight",
          selector:
            "input[name='name'], input[placeholder*='Event name'], input[data-guide='event-name']",
          duration: 5000,
        },
        { waitForUser: true, waitSelector: "input[name='name']" }
      ),
      step("Set the date and time for your event.", {
        type: "highlight",
        selector:
          "[data-guide='event-date'], input[type='date'], input[name*='date']",
        duration: 5000,
      }),
      step("Choose a room/location where the event will take place.", {
        type: "highlight",
        selector:
          "[data-guide='event-room'], select[name*='room'], [data-guide='room-select']",
        duration: 5000,
      }),
      step("When you're ready, save the event. You can always edit it later.", {
        type: "highlight",
        selector:
          "button[type='submit'], button[data-guide='save-event'], button:has-text('Save'), button:has-text('Create')",
        duration: 5000,
      }),
      step("After creating the event, you can add ticket categories to start selling.", {
        type: "subtitle",
        text: "After saving, you can add ticket categories to start selling tickets. Ask me 'how to create a ticket category' to learn more!",
        duration: 6000,
      }),
    ],
  },

  // ─── TICKETING ──────────────────────────────────────────────────
  {
    id: "create-ticket-category",
    name: "Create a Ticket Category",
    description:
      "Add a ticket category (like General Admission or VIP) to an event.",
    area: "ticketing",
    keywords: [
      "ticket category",
      "create ticket",
      "add ticket",
      "ticket type",
      "general admission",
      "VIP",
      "Ticketkategorie",
    ],
    steps: [
      step("To create a ticket category, first go to your event.", {
        type: "subtitle",
        text: "First, navigate to the event you want to add tickets to. Open it from the events list.",
        duration: 4000,
      }),
      step("Inside the event, find the Tickets tab.", {
        type: "highlight",
        selector:
          "[data-guide='tickets-tab'], button:has-text('Tickets'), a:has-text('Tickets')",
        duration: 4000,
      }),
      step("Click 'Add Category' or '+' to create a new ticket type.", {
        type: "highlight",
        selector:
          "button[data-guide='add-category'], button:has-text('Add Category'), button:has-text('New Category')",
        duration: 5000,
      }),
      step("Enter the category name (e.g., 'General Admission', 'VIP Table').", {
        type: "highlight",
        selector:
          "input[data-guide='category-name'], input[name='name'], input[placeholder*='Category']",
        duration: 5000,
      }),
      step("Set the price per ticket.", {
        type: "highlight",
        selector:
          "input[data-guide='category-price'], input[name='price'], input[type='number']",
        duration: 4000,
      }),
      step("Set how many tickets are available in this category.", {
        type: "highlight",
        selector:
          "input[data-guide='category-quantity'], input[name*='quantity'], input[name*='capacity']",
        duration: 4000,
      }),
      step("Save the category. You can then create a ticket link to start selling!", {
        type: "subtitle",
        text: "After saving, create a Ticket Link to generate a public URL where customers can buy tickets. Ask me 'how to create a ticket link'!",
        duration: 6000,
      }),
    ],
  },

  {
    id: "create-ticket-link",
    name: "Create a Ticket Link (Public Sale Page)",
    description:
      "Set up a public ticket page where customers can browse and buy tickets.",
    area: "ticketing",
    keywords: [
      "ticket link",
      "sale page",
      "selling tickets",
      "public page",
      "ticket URL",
      "share tickets",
      "Ticketlink",
    ],
    steps: [
      step("Let's create a ticket link. Go to the Ticketing section.", {
        type: "navigate",
        path: "/ticketing",
      }),
      step("Look for the 'Create Link' or 'New Link' button.", {
        type: "highlight",
        selector:
          "button[data-guide='create-link'], button:has-text('Create'), button:has-text('New Link')",
        duration: 5000,
      }),
      step("Give your ticket link a name and a URL slug (e.g., 'summer-party').", {
        type: "highlight",
        selector:
          "input[data-guide='link-name'], input[name='name'], input[name='slug']",
        duration: 5000,
      }),
      step("Select which ticket categories should appear on this sale page.", {
        type: "highlight",
        selector:
          "[data-guide='category-select'], [data-guide='ticket-categories']",
        duration: 5000,
      }),
      step("Optionally add a cover image to make it look great.", {
        type: "highlight",
        selector:
          "[data-guide='cover-image'], input[type='file'], [data-guide='image-upload']",
        duration: 4000,
      }),
      step("Save and your ticket page is live! Share the link with your audience.", {
        type: "subtitle",
        text: "Once saved, your ticket page is live at app.openevent.io/ticket/your-slug. Share this URL on social media, your website, or via email!",
        duration: 6000,
      }),
    ],
  },

  {
    id: "setup-split-payment",
    name: "Set Up Split Payment / Deposits",
    description:
      "Configure deposit payments where customers pay part now and the rest later.",
    area: "ticketing",
    keywords: [
      "split payment",
      "deposit",
      "pay later",
      "partial payment",
      "remaining payment",
      "Anzahlung",
      "Ratenzahlung",
    ],
    steps: [
      step("Split payment is configured per ticket category. Open a ticket category.", {
        type: "subtitle",
        text: "Split payment is set up on individual ticket categories. Open an event, then click on a ticket category to edit it.",
        duration: 5000,
      }),
      step("Look for the 'Payment' or 'Split Payment' section in the category settings.", {
        type: "highlight",
        selector:
          "[data-guide='split-payment'], [data-guide='payment-settings']",
        duration: 5000,
      }),
      step("Enable split payment and set the deposit amount (percentage or fixed).", {
        type: "highlight",
        selector:
          "[data-guide='deposit-amount'], input[name*='deposit']",
        duration: 5000,
      }),
      step("Set the deadline for the remaining payment.", {
        type: "highlight",
        selector:
          "[data-guide='payment-deadline'], input[name*='deadline'], input[type='date']",
        duration: 5000,
      }),
      step("Choose what happens if the deadline passes (cancel order, send reminder, etc.).", {
        type: "highlight",
        selector:
          "[data-guide='deadline-action'], select[name*='action']",
        duration: 5000,
      }),
      step("Save the settings. Customers will now pay a deposit at checkout.", {
        type: "subtitle",
        text: "Done! Customers will pay the deposit at checkout and receive reminders for the remaining balance before the deadline.",
        duration: 6000,
      }),
    ],
  },

  // ─── MEMBERSHIP ─────────────────────────────────────────────────
  {
    id: "setup-membership",
    name: "Set Up Memberships",
    description:
      "Create membership plans and start accepting members for your venue.",
    area: "membership",
    keywords: [
      "membership",
      "members",
      "subscription",
      "plans",
      "tiers",
      "club membership",
      "Mitgliedschaft",
    ],
    steps: [
      step("Let's set up memberships. Go to the Membership section.", {
        type: "navigate",
        path: "/membership",
      }),
      step("This is your membership dashboard. Let's start by creating a plan.", {
        type: "navigate",
        path: "/membership/plans",
      }),
      step("Click 'Create Plan' to set up your first membership tier.", {
        type: "highlight",
        selector:
          "button[data-guide='create-plan'], button:has-text('Create'), button:has-text('Add Plan')",
        duration: 5000,
      }),
      step("Give the plan a name (e.g., 'Basic', 'Premium', 'VIP').", {
        type: "highlight",
        selector: "input[name='name'], input[data-guide='plan-name']",
        duration: 4000,
      }),
      step("Set the price and billing cycle (monthly or yearly).", {
        type: "highlight",
        selector:
          "input[name='price'], [data-guide='billing-cycle'], select[name*='interval']",
        duration: 5000,
      }),
      step("Describe the benefits members get with this plan.", {
        type: "highlight",
        selector:
          "textarea[name*='description'], [data-guide='plan-benefits']",
        duration: 4000,
      }),
      step("Save the plan. Members can now subscribe to it!", {
        type: "subtitle",
        text: "After saving, your plan is ready. You can customize the member app appearance in the 'Member App' tab. Ask me 'how to customize the member app'!",
        duration: 6000,
      }),
    ],
  },

  {
    id: "manage-members",
    name: "Manage Your Members",
    description: "View, search, and manage your membership base.",
    area: "membership",
    keywords: [
      "view members",
      "member list",
      "find member",
      "member status",
      "manage members",
      "Mitglieder verwalten",
    ],
    steps: [
      step("Go to the Members list to see all your members.", {
        type: "navigate",
        path: "/membership/members",
      }),
      step("Here you can see all your members with their status, plan, and join date.", {
        type: "highlight",
        selector: "table, [data-guide='members-table']",
        duration: 4000,
      }),
      step("Use the search bar to find specific members by name or email.", {
        type: "highlight",
        selector:
          "input[type='search'], input[placeholder*='Search'], [data-guide='member-search']",
        duration: 4000,
      }),
      step("Filter members by status, plan, or other criteria.", {
        type: "highlight",
        selector:
          "[data-guide='member-filters'], button:has-text('Filter')",
        duration: 4000,
      }),
      step("Click on any member to see their full profile and history.", {
        type: "subtitle",
        text: "Click on any member row to see their full profile, transaction history, and membership details.",
        duration: 5000,
      }),
    ],
  },

  // ─── POS ────────────────────────────────────────────────────────
  {
    id: "setup-pos",
    name: "Set Up Point of Sale",
    description: "Configure POS for on-site sales at your venue.",
    area: "pos",
    keywords: [
      "POS",
      "point of sale",
      "register",
      "cash register",
      "sell on site",
      "bar sales",
      "Kasse",
    ],
    steps: [
      step("Let's set up your Point of Sale. Go to the POS section.", {
        type: "navigate",
        path: "/pos",
      }),
      step("This is your POS interface - a touch-optimized grid for fast sales.", {
        type: "subtitle",
        text: "The POS is designed for touch screens. Your staff can quickly select items and process payments.",
        duration: 4000,
      }),
      step("First, create a POS Outlet (e.g., 'Main Bar', 'Entrance', 'Merch').", {
        type: "highlight",
        selector:
          "button[data-guide='create-outlet'], button:has-text('Create'), button:has-text('Add Outlet')",
        duration: 5000,
      }),
      step("Add products to your outlet - these appear as tiles on the POS screen.", {
        type: "highlight",
        selector:
          "[data-guide='add-product'], button:has-text('Add Product'), button:has-text('Add Item')",
        duration: 5000,
      }),
      step("Configure payment methods: cash, card (Stripe Terminal), or TWINT.", {
        type: "highlight",
        selector:
          "[data-guide='payment-methods'], [data-guide='pos-settings']",
        duration: 5000,
      }),
      step("Your POS is ready! Staff can now start selling.", {
        type: "subtitle",
        text: "Staff access the POS at /pos or through the CrewApp. They can process sales, split bills, and print receipts.",
        duration: 6000,
      }),
    ],
  },

  // ─── MARKETING ──────────────────────────────────────────────────
  {
    id: "create-campaign",
    name: "Create an Email Campaign",
    description: "Build and send an email campaign to your audience.",
    area: "marketing",
    keywords: [
      "campaign",
      "email",
      "newsletter",
      "send email",
      "marketing email",
      "Kampagne",
      "Newsletter",
    ],
    steps: [
      step("Let's create a campaign. Go to the Audience section.", {
        type: "navigate",
        path: "/audience",
      }),
      step("Navigate to Outreach to manage campaigns and automations.", {
        type: "navigate",
        path: "/audience/outreach",
      }),
      step("Click 'Create Campaign' to start building your email.", {
        type: "highlight",
        selector:
          "button[data-guide='create-campaign'], button:has-text('Create Campaign'), button:has-text('New Campaign')",
        duration: 5000,
      }),
      step("Choose your audience - who should receive this email?", {
        type: "highlight",
        selector:
          "[data-guide='audience-select'], [data-guide='segment-select']",
        duration: 5000,
      }),
      step("Write your subject line - make it compelling!", {
        type: "highlight",
        selector:
          "input[name='subject'], input[data-guide='email-subject']",
        duration: 4000,
      }),
      step("Design your email using the drag-and-drop editor.", {
        type: "highlight",
        selector:
          "[data-guide='email-editor'], [data-guide='email-builder']",
        duration: 5000,
      }),
      step("Preview your email, then schedule or send it.", {
        type: "subtitle",
        text: "Preview your email on desktop and mobile, then either send it immediately or schedule it for later.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "setup-automation",
    name: "Set Up Email Automations",
    description:
      "Create automated email sequences triggered by customer actions.",
    area: "marketing",
    keywords: [
      "automation",
      "automated email",
      "trigger",
      "welcome email",
      "reminder",
      "auto email",
      "Automatisierung",
    ],
    steps: [
      step("Go to the Outreach section in Audience.", {
        type: "navigate",
        path: "/audience/outreach",
      }),
      step("Look for the Automations area to create automated sequences.", {
        type: "highlight",
        selector:
          "[data-guide='automations'], button:has-text('Automation'), [data-guide='automation-tab']",
        duration: 5000,
      }),
      step("Create a new automation and choose the trigger.", {
        type: "subtitle",
        text: "Common triggers: new ticket purchase, membership signup, event date approaching, payment deadline. Choose what should start the email sequence.",
        duration: 6000,
      }),
      step("Design the email that gets sent automatically.", {
        type: "highlight",
        selector: "[data-guide='automation-email'], [data-guide='email-editor']",
        duration: 5000,
      }),
      step("Set timing: when should the email be sent after the trigger?", {
        type: "highlight",
        selector:
          "[data-guide='automation-timing'], [data-guide='delay-settings']",
        duration: 5000,
      }),
      step("Activate the automation. It will run automatically from now on.", {
        type: "subtitle",
        text: "Once activated, the automation runs on its own. You can check its performance in the analytics tab.",
        duration: 5000,
      }),
    ],
  },

  // ─── SETTINGS ───────────────────────────────────────────────────
  {
    id: "setup-business",
    name: "Set Up Your Business Profile",
    description:
      "Configure your business name, address, logo, and basic information.",
    area: "settings",
    keywords: [
      "business setup",
      "company info",
      "logo",
      "address",
      "business profile",
      "Unternehmen einrichten",
    ],
    steps: [
      step("Let's set up your business profile. Go to Settings.", {
        type: "navigate",
        path: "/settings/business",
      }),
      step("Start with your business name - this appears on all documents.", {
        type: "highlight",
        selector:
          "input[name='name'], input[data-guide='business-name']",
        duration: 5000,
      }),
      step("Add your business address.", {
        type: "highlight",
        selector:
          "[data-guide='business-address'], input[name*='address'], textarea[name*='address']",
        duration: 4000,
      }),
      step("Upload your logo - it appears on tickets, invoices, and your public pages.", {
        type: "highlight",
        selector:
          "[data-guide='business-logo'], input[type='file'], [data-guide='logo-upload']",
        duration: 5000,
      }),
      step("Add your contact email and phone number.", {
        type: "highlight",
        selector:
          "input[name*='email'], input[name*='phone'], [data-guide='contact-info']",
        duration: 4000,
      }),
      step("Save your business profile. It will be used across the platform.", {
        type: "subtitle",
        text: "Your business info appears on tickets, invoices, public pages, and emails. You can update it anytime.",
        duration: 5000,
      }),
    ],
  },

  {
    id: "connect-stripe",
    name: "Connect Stripe for Payments",
    description:
      "Set up Stripe to accept online payments for tickets, memberships, and POS.",
    area: "settings",
    keywords: [
      "Stripe",
      "payments",
      "connect payments",
      "accept payments",
      "credit card",
      "payment setup",
      "Zahlungen einrichten",
    ],
    steps: [
      step("Go to Payment Settings to connect Stripe.", {
        type: "navigate",
        path: "/settings/payments",
      }),
      step("Find the Stripe Connect section.", {
        type: "highlight",
        selector:
          "[data-guide='stripe-connect'], button:has-text('Connect Stripe'), [data-guide='stripe-section']",
        duration: 5000,
      }),
      step("Click to connect your Stripe account (or create a new one).", {
        type: "subtitle",
        text: "You'll be redirected to Stripe to complete the setup. If you don't have a Stripe account, you can create one during this process. It takes about 10 minutes.",
        duration: 7000,
      }),
      step("Once connected, you can accept card payments for tickets, memberships, and POS.", {
        type: "subtitle",
        text: "After connecting Stripe, all online payments are processed automatically. Payouts go directly to your bank account on Stripe's schedule.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "setup-rooms",
    name: "Set Up Rooms and Spaces",
    description:
      "Configure your venue's rooms, capacity, and optional floor plans.",
    area: "settings",
    keywords: [
      "rooms",
      "spaces",
      "venue",
      "capacity",
      "floormap",
      "floor plan",
      "seating",
      "Raeume",
      "Raumplan",
    ],
    steps: [
      step("Go to Room Settings to set up your venue's spaces.", {
        type: "navigate",
        path: "/settings/rooms",
      }),
      step("Click 'Add Room' to create a new room or space.", {
        type: "highlight",
        selector:
          "button[data-guide='add-room'], button:has-text('Add Room'), button:has-text('Create Room')",
        duration: 5000,
      }),
      step("Give the room a name (e.g., 'Main Hall', 'Terrace', 'VIP Lounge').", {
        type: "highlight",
        selector: "input[name='name'], input[data-guide='room-name']",
        duration: 4000,
      }),
      step("Set the room's capacity.", {
        type: "highlight",
        selector:
          "input[name*='capacity'], input[data-guide='room-capacity']",
        duration: 4000,
      }),
      step("Optionally, create a floor plan with seats and tables.", {
        type: "subtitle",
        text: "You can add a visual floor plan with draggable seats and tables. This enables seat selection during ticket purchase. Ask me 'how to create a floor plan' to learn more!",
        duration: 6000,
      }),
    ],
  },

  {
    id: "invite-team",
    name: "Invite Team Members",
    description:
      "Add staff members to your OpenEvent account with appropriate roles.",
    area: "settings",
    keywords: [
      "invite",
      "team",
      "staff",
      "add user",
      "permissions",
      "roles",
      "Mitarbeiter einladen",
    ],
    steps: [
      step("Go to Staff Settings to manage your team.", {
        type: "navigate",
        path: "/settings/staff",
      }),
      step("Click 'Invite' to add a new team member.", {
        type: "highlight",
        selector:
          "button[data-guide='invite-staff'], button:has-text('Invite'), button:has-text('Add')",
        duration: 5000,
      }),
      step("Enter their email address.", {
        type: "highlight",
        selector: "input[type='email'], input[name='email']",
        duration: 4000,
      }),
      step("Choose their role: Admin (full access), Manager, Staff, or Scanner.", {
        type: "highlight",
        selector:
          "[data-guide='role-select'], select[name*='role']",
        duration: 5000,
      }),
      step("Send the invitation. They'll get an email to join your team.", {
        type: "subtitle",
        text: "They'll receive an email with a link to create their account and join your team. Scanner role only needs the QR scan feature - perfect for door staff.",
        duration: 6000,
      }),
    ],
  },

  // ─── FLOORMAP ───────────────────────────────────────────────────
  {
    id: "create-floormap",
    name: "Create a Floor Plan",
    description:
      "Build a visual floor plan with seats and tables for your venue.",
    area: "floormap",
    keywords: [
      "floor plan",
      "floormap",
      "seating chart",
      "table layout",
      "seats",
      "tables",
      "drag and drop",
      "Sitzplan",
      "Tischplan",
    ],
    steps: [
      step("Floor plans are created inside a room. Go to Room Settings.", {
        type: "navigate",
        path: "/settings/rooms",
      }),
      step("Open the room where you want to create a floor plan.", {
        type: "highlight",
        selector:
          "[data-guide='room-list'] tr, [data-guide='room-item']",
        duration: 5000,
      }),
      step("Find the 'Floor Plan' or 'Create Floormap' option.", {
        type: "highlight",
        selector:
          "button[data-guide='create-floormap'], button:has-text('Floor Plan'), button:has-text('Floormap')",
        duration: 5000,
      }),
      step("The floor plan editor opens. You can drag and drop tables and seats.", {
        type: "subtitle",
        text: "Use the toolbar to add rectangular tables, round tables, bar seats, or custom objects. Drag them to position them on the map.",
        duration: 6000,
      }),
      step("Resize and rotate objects to match your real venue layout.", {
        type: "subtitle",
        text: "Click an object to select it, then use the handles to resize or the rotation control to turn it. Name each table for easy reference.",
        duration: 5000,
      }),
      step("Save the floor plan. It can now be linked to ticket categories.", {
        type: "subtitle",
        text: "After saving, link this floor plan to a ticket category. Customers will then be able to choose their seat/table during ticket purchase!",
        duration: 6000,
      }),
    ],
  },

  // ─── WEBSITE BUILDER ───────────────────────────────────────────
  {
    id: "build-website",
    name: "Build Your Venue Website",
    description: "Create a website for your venue using the drag-and-drop builder.",
    area: "website",
    keywords: [
      "website",
      "build website",
      "web page",
      "landing page",
      "venue website",
      "Webseite erstellen",
    ],
    steps: [
      step("Let's build your website. Go to the Website Builder.", {
        type: "navigate",
        path: "/website",
      }),
      step("The website builder lets you create pages with drag-and-drop sections.", {
        type: "subtitle",
        text: "Add sections for events, about your venue, photo gallery, contact info, and more. Each section is customizable.",
        duration: 5000,
      }),
      step("Click 'Add Section' to start building your page.", {
        type: "highlight",
        selector:
          "button[data-guide='add-section'], button:has-text('Add Section'), button:has-text('Add Block')",
        duration: 5000,
      }),
      step("Choose from section types: Hero, Events, About, Gallery, Contact, etc.", {
        type: "highlight",
        selector: "[data-guide='section-picker'], [data-guide='block-picker']",
        duration: 5000,
      }),
      step("Customize each section with your content, images, and colors.", {
        type: "subtitle",
        text: "Click on any section to edit it. Change text, upload images, adjust colors and spacing. The preview updates in real-time.",
        duration: 5000,
      }),
      step("When ready, publish your website. It'll be live instantly.", {
        type: "highlight",
        selector:
          "button[data-guide='publish'], button:has-text('Publish')",
        duration: 5000,
      }),
      step("Your website is now live and accessible to anyone!", {
        type: "subtitle",
        text: "Your website is published at app.openevent.io/sites/your-slug. Share this URL or set up a custom domain.",
        duration: 6000,
      }),
    ],
  },

  // ─── ANALYTICS ──────────────────────────────────────────────────
  {
    id: "view-reports",
    name: "View Reports and Analytics",
    description: "Access your business reports, revenue data, and insights.",
    area: "analytics",
    keywords: [
      "reports",
      "analytics",
      "revenue",
      "statistics",
      "data",
      "insights",
      "Berichte",
      "Statistiken",
    ],
    steps: [
      step("Go to the Reports section for business analytics.", {
        type: "navigate",
        path: "/reports",
      }),
      step("Here you'll find reports on revenue, tickets sold, and more.", {
        type: "subtitle",
        text: "Reports show your business performance over time. Filter by date range, event, or category to drill down into the data.",
        duration: 5000,
      }),
      step("Use the date range selector to filter the time period.", {
        type: "highlight",
        selector:
          "[data-guide='date-range'], input[type='date'], [data-guide='date-filter']",
        duration: 4000,
      }),
      step("Revenue, ticket sales, and member metrics are all available.", {
        type: "subtitle",
        text: "The dashboard updates in real-time. You can also export data to CSV for further analysis.",
        duration: 5000,
      }),
    ],
  },

  // ─── QUICK SETUP ────────────────────────────────────────────────
  {
    id: "quick-setup",
    name: "Complete Quick Setup",
    description: "Run through the initial setup wizard for new accounts.",
    area: "settings",
    keywords: [
      "quick setup",
      "initial setup",
      "wizard",
      "get started quickly",
      "onboarding",
      "Schnelleinrichtung",
    ],
    steps: [
      step("Let me take you to the Quick Setup wizard.", {
        type: "navigate",
        path: "/settings/quick-setup",
      }),
      step("The Quick Setup guides you through the essential configuration steps.", {
        type: "subtitle",
        text: "Follow each step: business info, room setup, Stripe connection, and your first event. Each step builds on the previous one.",
        duration: 5000,
      }),
      step("Work through each section. I'm here if you have questions about any step!", {
        type: "subtitle",
        text: "The wizard saves your progress, so you can come back to it anytime. Ask me about any specific step if you need help!",
        duration: 5000,
      }),
    ],
  },

  // ─── CRM ────────────────────────────────────────────────────────
  {
    id: "use-crm",
    name: "Use the CRM Pipeline",
    description: "Manage leads and client relationships with the CRM board.",
    area: "general",
    keywords: [
      "CRM",
      "pipeline",
      "leads",
      "clients",
      "relationships",
      "sales pipeline",
      "Kundenbeziehungen",
    ],
    steps: [
      step("Go to the CRM section.", {
        type: "navigate",
        path: "/crm",
      }),
      step("The CRM is a pipeline board. Drag clients between stages.", {
        type: "subtitle",
        text: "Your pipeline stages represent the client journey: Lead, Contact Made, Proposal Sent, Won, Lost. Drag cards between columns as relationships progress.",
        duration: 6000,
      }),
      step("Add a new lead or client by clicking the add button.", {
        type: "highlight",
        selector:
          "button[data-guide='add-lead'], button:has-text('Add'), button:has-text('New')",
        duration: 5000,
      }),
      step("Click on any card to see full client details and history.", {
        type: "subtitle",
        text: "Each card shows the client's contact info, notes, associated events, and communication history.",
        duration: 5000,
      }),
    ],
  },

  // ─── SCANNER ────────────────────────────────────────────────────
  {
    id: "use-scanner",
    name: "Use the Ticket Scanner",
    description: "Check in guests by scanning their ticket QR codes.",
    area: "general",
    keywords: [
      "scanner",
      "check in",
      "QR code",
      "scan ticket",
      "door",
      "entrance",
      "Einlass",
      "Scanner",
    ],
    steps: [
      step("The scanner is at /scan. Let me take you there.", {
        type: "navigate",
        path: "/scan",
      }),
      step("Point the camera at a ticket QR code to scan it.", {
        type: "subtitle",
        text: "The scanner validates the ticket in real-time. Green = valid, Red = already used or invalid. It works on any device with a camera.",
        duration: 5000,
      }),
      step("Scanner mode is also available in the CrewApp for mobile staff.", {
        type: "subtitle",
        text: "For door staff, the CrewApp provides a dedicated scanning experience. Staff only need Scanner role permissions - no full admin access required.",
        duration: 6000,
      }),
    ],
  },
];

// ── Registry API ─────────────────────────────────────────────────

export function getAllFlows(): Flow[] {
  return flows;
}

export function getFlowById(id: string): Flow | undefined {
  return flows.find((f) => f.id === id);
}

export function findFlowsByKeyword(keyword: string): Flow[] {
  const lower = keyword.toLowerCase();
  return flows.filter(
    (f) =>
      f.keywords.some((k) => k.toLowerCase().includes(lower)) ||
      f.name.toLowerCase().includes(lower) ||
      f.description.toLowerCase().includes(lower)
  );
}

export function getFlowsByArea(area: Flow["area"]): Flow[] {
  return flows.filter((f) => f.area === area);
}
