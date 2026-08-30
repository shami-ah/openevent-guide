/**
 * Flow Registry - CORRECTED selectors based on real OpenEvent DOM
 *
 * Sidebar structure (from AppSidebar.tsx):
 *   <SidebarMenuItem>
 *     <SidebarMenuButton asChild>
 *       <NavLink to="/ticketing" className="...">
 *         <Icon /> <span>Ticketing</span>
 *       </NavLink>
 *     </SidebarMenuButton>
 *   </SidebarMenuItem>
 *
 * Sidebar links: a[href="/calendar"], a[href="/payments"], a[href="/ticketing"],
 *   a[href="/pos"], a[href="/membership"], a[href="/audience"], a[href="/staff"],
 *   a[href="/tasks"], a[href="/notes"], a[href="/settings"], a[href="/reports"],
 *   a[href="/inbox"]
 *
 * The sidebar container: [data-sidebar="content"] or aside[data-sidebar]
 */

import type { AgentCommand, Flow, FlowStep } from "../shared/types.js";

let stepCounter = 0;
function step(
  description: string,
  command: AgentCommand,
  options?: { waitForUser?: boolean; waitSelector?: string }
): FlowStep {
  stepCounter++;
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

// ── Sidebar selector helper ──────────────────────────────────────
// The sidebar uses shadcn Sidebar + React Router NavLink.
// Each nav item is: <a href="/path" class="...">
const nav = (path: string) => `a[href="${path}"]`;

const flows: Flow[] = [
  // ─── GETTING STARTED ────────────────────────────────────────────
  {
    id: "getting-started",
    name: "Getting Started with OpenEvent",
    description: "A quick tour of the main sections of OpenEvent.",
    area: "general",
    keywords: ["getting started", "tour", "overview", "show me around", "new here", "first time"],
    steps: [
      step("Welcome! Let me show you around the platform.", {
        type: "subtitle",
        text: "Welcome to OpenEvent! Let me show you around the main areas of the platform.",
        duration: 4000,
      }),
      step("This is your Dashboard with recent updates and news.", {
        type: "navigate",
        path: "/updates",
      }),
      step("Calendar is where you see and create all your events.", {
        type: "highlight",
        selector: nav("/calendar"),
        duration: 3000,
      }),
      step("Ticketing manages your ticket links, sales, and reservations.", {
        type: "highlight",
        selector: nav("/ticketing"),
        duration: 3000,
      }),
      step("Payments tracks invoices, offers, and revenue.", {
        type: "highlight",
        selector: nav("/payments"),
        duration: 3000,
      }),
      step("Members is your membership management system.", {
        type: "highlight",
        selector: nav("/membership"),
        duration: 3000,
      }),
      step("Audience is your marketing hub for emails and campaigns.", {
        type: "highlight",
        selector: nav("/audience"),
        duration: 3000,
      }),
      step("Settings is where you configure your business and integrations.", {
        type: "highlight",
        selector: nav("/settings"),
        duration: 3000,
      }),
      step("That's the overview! Ask me about any feature to dive deeper.", {
        type: "subtitle",
        text: "That's the overview! Ask me about any specific feature to learn more.",
        duration: 5000,
      }),
    ],
  },

  // ─── CREATE EVENT ───────────────────────────────────────────────
  {
    id: "create-event",
    name: "Create Your First Event",
    description: "Step-by-step guide to creating a new event.",
    area: "events",
    keywords: ["create event", "new event", "add event", "first event", "Veranstaltung erstellen"],
    steps: [
      step("Let me take you to the Calendar where you create events.", {
        type: "navigate",
        path: "/calendar",
      }),
      step("Click 'Create Event' in the top right to make a new event.", {
        type: "highlight",
        selector: "button:has(span:contains('Create Event')), [data-guide='create-event'], button.bg-primary",
        duration: 5000,
      }),
      step("After creating your event, you can add ticket categories from the event page.", {
        type: "subtitle",
        text: "Click 'Create Event', fill in the name, date, and room, then save. Ask me 'how to create a ticket category' next!",
        duration: 6000,
      }),
    ],
  },

  // ─── TICKETING ──────────────────────────────────────────────────
  {
    id: "create-ticket-category",
    name: "Create a Ticket Category",
    description: "Add ticket types like General Admission or VIP to an event.",
    area: "ticketing",
    keywords: ["ticket category", "create ticket", "add ticket", "ticket type", "VIP", "Ticketkategorie"],
    steps: [
      step("First, open an event from the Calendar to add tickets to it.", {
        type: "navigate",
        path: "/calendar",
      }),
      step("Click on any event to open it, then find the Tickets tab inside.", {
        type: "subtitle",
        text: "Open an event from the calendar, then look for the 'Tickets' tab. That's where you add ticket categories with names, prices, and quantities.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "create-ticket-link",
    name: "Create a Ticket Link",
    description: "Set up a public ticket page where customers can buy tickets.",
    area: "ticketing",
    keywords: ["ticket link", "sale page", "selling tickets", "public page", "Ticketlink"],
    steps: [
      step("Let me take you to the Ticketing section.", {
        type: "navigate",
        path: "/ticketing",
      }),
      step("This is the Ticketing page where you manage all ticket links.", {
        type: "subtitle",
        text: "Here you can see all your ticket links. Each link is a public page where customers can browse and buy tickets.",
        duration: 5000,
      }),
      step("Look for the create button to make a new ticket link.", {
        type: "highlight",
        selector: "button:has(svg), [data-guide='create-link']",
        duration: 5000,
      }),
    ],
  },

  {
    id: "setup-split-payment",
    name: "Set Up Split Payment / Deposits",
    description: "Configure deposit payments for tickets.",
    area: "ticketing",
    keywords: ["split payment", "deposit", "pay later", "Anzahlung", "Ratenzahlung"],
    steps: [
      step("Split payment is configured per ticket category.", {
        type: "subtitle",
        text: "Split payment is set up on individual ticket categories. Open an event, go to its Tickets tab, and edit a category to find the payment settings.",
        duration: 6000,
      }),
    ],
  },

  // ─── MEMBERSHIP ─────────────────────────────────────────────────
  {
    id: "setup-membership",
    name: "Set Up Memberships",
    description: "Create membership plans for your venue.",
    area: "membership",
    keywords: ["membership", "members", "subscription", "plans", "Mitgliedschaft"],
    steps: [
      step("Let me take you to the Membership section.", {
        type: "navigate",
        path: "/membership",
      }),
      step("This is your membership hub with tabs for Dashboard, Members, Plans, and more.", {
        type: "subtitle",
        text: "The membership section has everything: member list, subscription plans, events for members, a points store, and your member app settings.",
        duration: 5000,
      }),
    ],
  },

  {
    id: "manage-members",
    name: "Manage Your Members",
    description: "View and manage your membership base.",
    area: "membership",
    keywords: ["view members", "member list", "manage members", "Mitglieder verwalten"],
    steps: [
      step("Let me take you to the Members section.", {
        type: "navigate",
        path: "/membership",
      }),
      step("Here you can see all your members, their status, and manage their subscriptions.", {
        type: "subtitle",
        text: "Use the search and filters to find specific members. Click any member to see their full profile and history.",
        duration: 5000,
      }),
    ],
  },

  // ─── POS ────────────────────────────────────────────────────────
  {
    id: "setup-pos",
    name: "Set Up Point of Sale",
    description: "Configure POS for on-site sales.",
    area: "pos",
    keywords: ["POS", "point of sale", "register", "Kasse"],
    steps: [
      step("Let me take you to the POS section.", {
        type: "navigate",
        path: "/pos",
      }),
      step("This is your Point of Sale dashboard for on-site sales.", {
        type: "subtitle",
        text: "Here you can create outlets (like 'Main Bar' or 'Entrance'), add products, and see transaction history. Staff access the POS from the CrewApp.",
        duration: 6000,
      }),
    ],
  },

  // ─── MARKETING ──────────────────────────────────────────────────
  {
    id: "create-campaign",
    name: "Create an Email Campaign",
    description: "Build and send an email campaign.",
    area: "marketing",
    keywords: ["campaign", "email", "newsletter", "Kampagne", "Newsletter"],
    steps: [
      step("Let me take you to the Audience section.", {
        type: "navigate",
        path: "/audience",
      }),
      step("This is your marketing hub for clients and campaigns.", {
        type: "subtitle",
        text: "The Audience section has three areas: Overview (stats), Clients (your contact database), and Outreach (campaigns and automations).",
        duration: 5000,
      }),
    ],
  },

  {
    id: "setup-automation",
    name: "Set Up Email Automations",
    description: "Create automated email sequences.",
    area: "marketing",
    keywords: ["automation", "automated email", "welcome email", "reminder", "Automatisierung"],
    steps: [
      step("Let me take you to the Audience section.", {
        type: "navigate",
        path: "/audience",
      }),
      step("Look for the Outreach tab to set up automations.", {
        type: "subtitle",
        text: "In Outreach, you can create automated email sequences triggered by events: new ticket purchase, membership signup, payment deadline, and more.",
        duration: 6000,
      }),
    ],
  },

  // ─── SETTINGS ───────────────────────────────────────────────────
  {
    id: "setup-business",
    name: "Set Up Your Business Profile",
    description: "Configure business name, address, and logo.",
    area: "settings",
    keywords: ["business setup", "company info", "logo", "Unternehmen einrichten"],
    steps: [
      step("Let me take you to Business Settings.", {
        type: "navigate",
        path: "/settings/business",
      }),
      step("This is where you set up your business information.", {
        type: "subtitle",
        text: "Fill in your business name, address, logo, and contact details. This information appears on tickets, invoices, and all public pages.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "connect-stripe",
    name: "Connect Stripe for Payments",
    description: "Set up Stripe to accept online payments.",
    area: "settings",
    keywords: ["Stripe", "payments", "accept payments", "credit card", "Zahlungen einrichten"],
    steps: [
      step("Let me take you to Payment Settings.", {
        type: "navigate",
        path: "/settings/payments",
      }),
      step("Here you can connect your Stripe account to accept payments.", {
        type: "subtitle",
        text: "Click the Connect Stripe button to link your account. If you don't have a Stripe account, you can create one during the process. It takes about 10 minutes.",
        duration: 7000,
      }),
    ],
  },

  {
    id: "setup-rooms",
    name: "Set Up Rooms and Spaces",
    description: "Configure your venue's rooms and capacity.",
    area: "settings",
    keywords: ["rooms", "spaces", "venue", "capacity", "floormap", "Raeume"],
    steps: [
      step("Let me take you to Room Settings.", {
        type: "navigate",
        path: "/settings/rooms",
      }),
      step("Here you create and manage your venue's rooms.", {
        type: "subtitle",
        text: "Add rooms like 'Main Hall', 'Terrace', or 'VIP Lounge'. Set capacity, and optionally create a visual floor plan with seats and tables.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "invite-team",
    name: "Invite Team Members",
    description: "Add staff to your OpenEvent account.",
    area: "settings",
    keywords: ["invite", "team", "staff", "add user", "Mitarbeiter einladen"],
    steps: [
      step("Let me take you to Staff Settings.", {
        type: "navigate",
        path: "/settings/staff",
      }),
      step("Here you can invite team members and assign roles.", {
        type: "subtitle",
        text: "Click Invite to add a new team member by email. Choose their role: Admin (full access), Manager, Staff, or Scanner (door staff only).",
        duration: 6000,
      }),
    ],
  },

  {
    id: "create-floormap",
    name: "Create a Floor Plan",
    description: "Build a visual floor plan with seats and tables.",
    area: "floormap",
    keywords: ["floor plan", "floormap", "seating", "tables", "Sitzplan", "Tischplan"],
    steps: [
      step("Floor plans are created inside a room. Let me take you to Room Settings.", {
        type: "navigate",
        path: "/settings/rooms",
      }),
      step("Open a room, then create a floor plan inside it.", {
        type: "subtitle",
        text: "Click on a room, then find the 'Floor Plan' option. You can drag and drop tables, seats, and objects to match your real venue layout.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "build-website",
    name: "Build Your Venue Website",
    description: "Create a website with the drag-and-drop builder.",
    area: "website",
    keywords: ["website", "build website", "landing page", "Webseite erstellen"],
    steps: [
      step("Let me take you to the Website Builder.", {
        type: "navigate",
        path: "/website",
      }),
      step("The website builder lets you create pages with sections.", {
        type: "subtitle",
        text: "Add sections for events, about your venue, gallery, contact info. Customize colors and content. When ready, publish and your site goes live instantly.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "view-reports",
    name: "View Reports and Analytics",
    description: "Access business reports and revenue data.",
    area: "analytics",
    keywords: ["reports", "analytics", "revenue", "Berichte", "Statistiken"],
    steps: [
      step("Let me take you to Reports.", {
        type: "navigate",
        path: "/reports",
      }),
      step("This is your business analytics dashboard.", {
        type: "subtitle",
        text: "See revenue, ticket sales, and member metrics over time. Filter by date range and export data to CSV for further analysis.",
        duration: 5000,
      }),
    ],
  },

  {
    id: "quick-setup",
    name: "Complete Quick Setup",
    description: "Run through the initial setup wizard.",
    area: "settings",
    keywords: ["quick setup", "initial setup", "wizard", "get started", "Schnelleinrichtung"],
    steps: [
      step("Let me take you to the Quick Setup wizard.", {
        type: "navigate",
        path: "/settings/quick-setup",
      }),
      step("The Quick Setup guides you through essential configuration.", {
        type: "subtitle",
        text: "Follow each step: business info, room setup, Stripe connection, and your first event. The wizard saves your progress so you can come back anytime.",
        duration: 6000,
      }),
    ],
  },

  {
    id: "use-crm",
    name: "Use the CRM Pipeline",
    description: "Manage leads and client relationships.",
    area: "general",
    keywords: ["CRM", "pipeline", "leads", "clients", "Kundenbeziehungen"],
    steps: [
      step("The CRM is in the Audience section. Let me take you there.", {
        type: "navigate",
        path: "/audience",
      }),
      step("Use Audience to manage your client relationships.", {
        type: "subtitle",
        text: "The Clients tab shows your full contact database. You can segment, tag, and track interactions with every client.",
        duration: 5000,
      }),
    ],
  },

  {
    id: "use-scanner",
    name: "Use the Ticket Scanner",
    description: "Check in guests by scanning QR codes.",
    area: "general",
    keywords: ["scanner", "check in", "QR code", "scan ticket", "Einlass", "Scanner"],
    steps: [
      step("The scanner is a standalone page for door staff.", {
        type: "subtitle",
        text: "Go to /scan on any device with a camera. Select the event, point at a ticket QR code, and it validates in real-time. Green = valid, Red = already used. Staff only need Scanner role permissions.",
        duration: 7000,
      }),
    ],
  },
];

export function getAllFlows(): Flow[] { return flows; }
export function getFlowById(id: string): Flow | undefined { return flows.find((f) => f.id === id); }
export function findFlowsByKeyword(keyword: string): Flow[] {
  const lower = keyword.toLowerCase();
  return flows.filter((f) => f.keywords.some((k) => k.toLowerCase().includes(lower)) || f.name.toLowerCase().includes(lower));
}
export function getFlowsByArea(area: Flow["area"]): Flow[] { return flows.filter((f) => f.area === area); }
