/**
 * OpenEvent Knowledge Base
 *
 * Complete product knowledge for the AI brain. This is what makes the guide
 * understand the entire application from a user's perspective.
 *
 * Based on production code at fsoell/OpeneventGithub (staging).
 *
 * This is prose for the model, not a routing table. The paths mentioned here
 * help it describe the product; they are NOT the source of truth for
 * navigation. Anything a flow actually navigates to must be listed in
 * src/shared/appRoutes.ts, which is verified against the app and enforced by
 * src/flows/registry.test.ts.
 */

export const KNOWLEDGE_BASE = `
## Dashboard (/updates)
The main landing page after login. Shows recent activity, upcoming events,
notifications, and quick stats. Previously called "news" or "dashboard" -
all redirect here. This is where organizers start their day and see what
needs attention.

## Events (/events/:id)
The core of OpenEvent. Each event has tabs for details, ticket categories,
guest lists, and more.

### Creating an Event
Events are created from the events list. An event has a name, date/time,
location (linked to a room/space), description, and optional cover image.
Events can be recurring or one-time.

### Event Details
Each event page shows tabs with different aspects:
- **Overview**: event info, date, location, description
- **Tickets**: ticket categories and their sales dashboard
- **Guest List**: who's attending, check-in status
- **Settings**: event-specific configuration

### Ticket Categories (/events/:eventId/tickets/dashboard/:ticketId)
Each event can have multiple ticket categories (e.g., "General Admission",
"VIP", "Table Booking"). Each category has:
- Name, price, quantity available
- Description and conditions
- Sale period (start/end dates)
- Optional: deposit/split payment settings
- Optional: linked to a floormap (seats/tables)
- Optional: checkout questions (custom fields buyers fill in)
- Optional: inclusions (things included with the ticket like drinks, food)
- Optional: add-ons/upsells
- PDF ticket template (customizable design)

### Ticket PDF Template (/events/:eventId/tickets/dashboard/:ticketId/pdf-template/:templateId)
A visual editor for designing the PDF ticket that buyers receive. Drag and
drop elements: QR code, event name, buyer name, custom fields, logos, etc.

## Ticketing (/ticketing)
The ticketing overview page showing all ticket links (public sale pages),
reservations, and ticket orders across all events. This is the central
place to manage ticket sales.

### Ticket Links
A ticket link is a public URL where customers can buy tickets. Each link
can include multiple ticket categories from one or more events. Links have:
- A custom slug (e.g., /ticket/summer-party)
- Branding (cover image, colors)
- Selected ticket categories
- Optional: checkout questions
- Optional: terms and conditions
- Optional: split payment / deposit settings

### Split Payment / Deposits
Tickets can require a deposit upfront and remaining payment later. Settings:
- Deposit percentage or fixed amount
- Due date for remaining payment
- Action when deadline passes (cancel, remind, etc.)
- Automated reminders via email

### Reservations (/ticketing/reservations)
Manual reservations made by the organizer (not through the public ticket
page). Used for VIP guests, corporate bookings, etc.

## Payments (/payments)
Financial overview: invoices, offers, and payment tracking. Create custom
offers and invoices for clients. Stripe Connect integration for payment
processing. Shows revenue, refunds, and payout status.

### Creating Offers/Invoices (/payments/create)
Create professional offers and invoices with line items, taxes, discounts.
Can be sent to clients via email with a public link for review/acceptance.

## Membership (/membership)
Full membership management system for clubs and recurring-access venues.

### Membership Dashboard (/membership/dashboard)
Overview of active members, revenue, churn, and membership health metrics.

### Members (/membership/members)
List of all members with status, plan, join date, age verification status.
Supports search, filter, and bulk actions.

### Plans (Tiers) (/membership/plans)
Membership tiers (e.g., "Basic", "Premium", "VIP"). Each plan has:
- Name, price, billing cycle (monthly/yearly)
- Benefits description
- Access rules
- Optional: age verification requirement

### Member App (/membership/member-app)
Settings for the member-facing mobile app (published at /membership/:slug).
Customize the app's appearance: colors, logo, sections, KPIs shown.
The member app is a separate experience for members to see their status,
upcoming events, points balance, and membership card.

### Age Verification (KYC)
Stripe Identity integration for verifying member ages. Required for venues
with age restrictions. States: Not Verified, In Progress, Verified, Underage.

### Store / Points (/membership/store)
Points-based loyalty system. Members earn points from purchases and can
redeem them in the store.

### Referrals (/membership/referrals)
Member referral program settings and tracking.

## POS (Point of Sale) (/pos)
Touch-optimized point-of-sale system for on-site sales. Used at bars,
entrance desks, and merchandise stands.

### POS Main Page
Grid of product categories and items for quick sale. Supports:
- Cash, card (Stripe Terminal), and TWINT payments
- Split bills
- Receipts via the CrewApp
- Real-time transaction logging

### POS Outlets (/pos/outlets/:id)
Configure different sale points (bar, entrance, merch stand). Each outlet
has its own product catalog, staff assignments, and register.

### POS Analytics
Transaction history, revenue by outlet, popular items, staff performance.
Accessible from the POS main page.

## Audience / Marketing (/audience)
Comprehensive marketing hub for client communication.

### Overview (/audience)
Dashboard showing marketing health: subscriber count, engagement rates,
recent campaigns, and automation activity.

### Clients (/audience/clients)
Client/contact database. Every ticket buyer, member, and manual entry.
Supports segmentation, tagging, import/export. Clients can be filtered
by event attendance, purchase history, membership status, etc.

### Outreach (/audience/outreach)
Email campaigns and automations.

#### Campaigns
Create and send email campaigns to segments of your audience. Features:
- Drag-and-drop email builder with templates
- Audience segmentation (by tags, events, purchase history)
- Scheduled sending
- Analytics (open rate, click rate, bounces)
- A/B testing support

#### Automations
Set up automated email sequences triggered by events:
- Welcome emails for new ticket buyers
- Reminder emails before events
- Follow-up emails after events
- Membership onboarding sequences
- Payment reminder automations
- Remaining payment deadline reminders

## CRM (/crm)
Relationship management view. Pipeline-style board for managing leads,
prospects, and client relationships. Drag-and-drop between stages.

## Staff (/staff)
Staff management: team members, roles, permissions, and shift scheduling.

### Staff Shifts (/staff/shifts/:date)
Daily shift planning and assignment. See who's working when and where.

## Calendar (/calendar)
Visual calendar showing all events. Month, week, and day views.
Can be printed (/calendar/print) for physical reference.

## Inbox / Email (/email)
Email inbox for team communication. Previously at /inbox (redirects).
Manage customer inquiries, booking requests, and team messages.

## Files (/files)
File management: documents, images, contracts. Organized by type and
linked to events or clients.

## Reports (/reports)
Business analytics and reporting.

### Ticket Vouchers (/reports/ticket-vouchers)
Report on ticket voucher usage and redemption.

## Notifications (/notifications)
Notification center: system alerts, booking confirmations, payment
notifications, staff messages.

## Scanner (/scan)
QR code scanner for checking in guests at events. Validates tickets
in real-time and updates attendance status. Used by door staff.
Accessible without full admin permissions.

## Settings
Comprehensive settings organized by category:

### Business (/settings/business)
Company name, address, logo, contact info. The foundation that appears
on invoices, tickets, and public pages.

### Staff (/settings/staff)
Invite team members, set roles (Admin, Manager, Staff, Scanner),
manage permissions for who can access what.

### Payments (/settings/payments)
Stripe Connect setup, payment methods, currency, payout schedule.
This is where you connect your Stripe account to receive payments.

### Ticketing (/settings/ticketing)
Default ticket settings, checkout behavior, confirmation emails,
ticket PDF defaults, terms and conditions templates.

### Taxes (/settings/taxes)
Tax rates for different product types. Applied to tickets, POS items,
invoices. Supports multiple tax rates and exemptions.

### Calendar (/settings/calendar)
Calendar display settings, working hours, booking slots.

### Security (/settings/security)
Two-factor authentication, session management, API keys.

### Rooms (/settings/rooms)
Physical spaces in your venue. Each room can have a floormap with
seats/tables. Events are linked to rooms. Room capacity is tracked.

### Knowledge (/settings/knowledge)
AI knowledge base for your venue. Feed your venue's information
(menu, FAQ, policies) to the AI assistant.

### Formats (/settings/formats)
Date/time format, currency display, language preferences.

### Quick Setup (/settings/quick-setup)
Step-by-step wizard for new accounts. Guides through essential
setup: business info, rooms, first event, Stripe connection.

## Website Builder (/website)
Build and publish a website for your venue. Drag-and-drop page builder
with sections for events, about, contact, gallery. Published sites
are served at /sites/:slug.

## Feedback (/feedback)
Forum-style feedback page for collecting suggestions and bug reports
from team members.

## Welcome (/welcome)
Onboarding review page showing setup progress and recommended next steps.

## Public Pages (no auth required)
These are customer-facing pages:
- **/ticket/:slug** - Public ticket purchase page
- **/ticket/:slug/success** - Order confirmation after purchase
- **/offer/:id** - Public offer document
- **/invoice/:id** - Public invoice document
- **/guestlist/:token** - Public guest registration form
- **/confirm-offer/:token** - Offer confirmation page
- **/membership/:slug/** - Member app (for members)
- **/:slug** - Linktree-style venue landing page
- **/sites/:slug** - Published venue website
- **/campaign/view** - Email campaign web view
- **/unsubscribe** - Email unsubscribe page
`;
