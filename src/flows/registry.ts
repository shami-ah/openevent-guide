/**
 * Flow registry.
 *
 * A flow is a short, scripted walkthrough: navigate somewhere real, point at
 * something real, explain it. Two rules make flows trustworthy:
 *
 *   1. Every `navigate` path must exist in src/shared/appRoutes.ts.
 *   2. Every `highlight`/`click` must reference a target id from
 *      src/flows/targets.ts, never an inline selector.
 *
 * registry.test.ts enforces both, so a flow that would dead-end a user fails
 * the build instead.
 *
 * Copy is authored per language because the app ships EN/DE/FR. A flow that
 * narrates in English to a French venue manager is worse than no flow.
 */

import type { AgentCommand, Flow, FlowDef, FlowStep, FlowSummary } from "../shared/types.js";
import { resolveText, type Lang } from "../shared/i18n.js";
import { getTarget } from "./targets.js";

const flows: FlowDef[] = [
  // ─── GETTING STARTED ────────────────────────────────────────────
  {
    id: "getting-started",
    name: { en: "Getting Started with OpenEvent", de: "Erste Schritte mit OpenEvent", fr: "Premiers pas avec OpenEvent" },
    description: {
      en: "A quick tour of the main sections of OpenEvent.",
      de: "Ein kurzer Rundgang durch die Hauptbereiche von OpenEvent.",
      fr: "Un tour rapide des sections principales d'OpenEvent.",
    },
    area: "general",
    keywords: ["getting started", "tour", "overview", "show me around", "new here", "first time", "rundgang", "ueberblick", "visite", "apercu"],
    steps: [
      {
        description: {
          en: "Welcome! Let me show you around the platform.",
          de: "Willkommen! Ich zeige Ihnen die Plattform.",
          fr: "Bienvenue ! Je vous fais visiter la plateforme.",
        },
        command: { type: "subtitle", text: {
          en: "Welcome to OpenEvent. Let me show you the main areas.",
          de: "Willkommen bei OpenEvent. Ich zeige Ihnen die wichtigsten Bereiche.",
          fr: "Bienvenue sur OpenEvent. Je vous montre les zones principales.",
        }, duration: 4000 },
      },
      {
        description: {
          en: "This is your dashboard, with recent activity and what needs attention.",
          de: "Das ist Ihr Dashboard mit den letzten Aktivitaeten.",
          fr: "Voici votre tableau de bord, avec l'activite recente.",
        },
        command: { type: "navigate", path: "/updates" },
      },
      {
        description: {
          en: "The Calendar is where you see and create all your events.",
          de: "Im Kalender sehen und erstellen Sie alle Ihre Veranstaltungen.",
          fr: "Le Calendrier vous permet de voir et creer tous vos evenements.",
        },
        command: { type: "highlight", target: "nav.calendar", duration: 3000 },
      },
      {
        description: {
          en: "Ticketing manages your ticket links, sales and reservations.",
          de: "Unter Ticketing verwalten Sie Ticketlinks, Verkaeufe und Reservierungen.",
          fr: "Billetterie gere vos liens de billets, ventes et reservations.",
        },
        command: { type: "highlight", target: "nav.ticketing", duration: 3000 },
      },
      {
        description: {
          en: "Payments tracks invoices, offers and revenue.",
          de: "Zahlungen verfolgt Rechnungen, Angebote und Umsaetze.",
          fr: "Paiements suit les factures, offres et revenus.",
        },
        command: { type: "highlight", target: "nav.payments", duration: 3000 },
      },
      {
        description: {
          en: "Members is your membership management system.",
          de: "Mitglieder ist Ihre Mitgliederverwaltung.",
          fr: "Membres est votre systeme de gestion des adhesions.",
        },
        command: { type: "highlight", target: "nav.membership", duration: 3000 },
      },
      {
        description: {
          en: "Audience is your marketing hub for clients and campaigns.",
          de: "Audience ist Ihre Marketingzentrale fuer Kunden und Kampagnen.",
          fr: "Audience est votre hub marketing pour clients et campagnes.",
        },
        command: { type: "highlight", target: "nav.audience", duration: 3000 },
      },
      {
        description: {
          en: "And Settings is where you configure your business and integrations.",
          de: "Und in den Einstellungen konfigurieren Sie Ihr Unternehmen und Integrationen.",
          fr: "Et Parametres est ou vous configurez votre entreprise et vos integrations.",
        },
        command: { type: "highlight", target: "nav.settings", duration: 3000 },
      },
      {
        description: {
          en: "That's the overview. Ask me about any feature to go deeper.",
          de: "Das war der Ueberblick. Fragen Sie mich zu jeder Funktion.",
          fr: "Voila pour l'apercu. Posez-moi une question sur n'importe quelle fonction.",
        },
        command: { type: "subtitle", text: {
          en: "That's the overview. Ask me about any feature to learn more.",
          de: "Das war der Ueberblick. Fragen Sie mich nach einer Funktion.",
          fr: "Voila l'apercu. Demandez-moi plus de details sur une fonction.",
        }, duration: 5000 },
      },
    ],
  },

  // ─── EVENTS ─────────────────────────────────────────────────────
  {
    id: "create-event",
    name: { en: "Create Your First Event", de: "Erste Veranstaltung erstellen", fr: "Creer votre premier evenement" },
    description: {
      en: "Step-by-step guide to creating a new event.",
      de: "Schritt fuer Schritt zu einer neuen Veranstaltung.",
      fr: "Guide pas a pas pour creer un nouvel evenement.",
    },
    area: "events",
    keywords: ["create event", "new event", "add event", "first event", "veranstaltung erstellen", "neue veranstaltung", "creer evenement", "nouvel evenement"],
    steps: [
      {
        description: {
          en: "Let me take you to the Calendar, where events are created.",
          de: "Ich bringe Sie zum Kalender, wo Veranstaltungen erstellt werden.",
          fr: "Je vous emmene au Calendrier, ou les evenements sont crees.",
        },
        command: { type: "navigate", path: "/calendar" },
      },
      {
        description: {
          en: "This is the Create Event button, in the top right.",
          de: "Das ist der Button 'Veranstaltung erstellen' oben rechts.",
          fr: "Voici le bouton Creer un evenement, en haut a droite.",
        },
        command: { type: "highlight", target: "calendar.createEvent", duration: 5000 },
      },
      {
        description: {
          en: "Fill in the name, date and room, then save.",
          de: "Name, Datum und Raum eintragen, dann speichern.",
          fr: "Renseignez le nom, la date et la salle, puis enregistrez.",
        },
        command: { type: "subtitle", text: {
          en: "Click it, fill in the name, date and room, then save. Ask me about ticket categories next.",
          de: "Klicken Sie darauf, tragen Sie Name, Datum und Raum ein und speichern Sie. Fragen Sie mich als Naechstes nach Ticketkategorien.",
          fr: "Cliquez dessus, renseignez le nom, la date et la salle, puis enregistrez. Demandez-moi ensuite les categories de billets.",
        }, duration: 6000 },
      },
    ],
  },

  // ─── TICKETING ──────────────────────────────────────────────────
  {
    id: "create-ticket-link",
    name: { en: "Create a Ticket Link", de: "Ticketlink erstellen", fr: "Creer un lien de billetterie" },
    description: {
      en: "Set up a public page where customers can buy tickets.",
      de: "Eine oeffentliche Seite einrichten, auf der Kunden Tickets kaufen.",
      fr: "Creer une page publique ou les clients achetent des billets.",
    },
    area: "ticketing",
    keywords: ["ticket link", "sale page", "selling tickets", "public page", "ticketlink", "verkaufsseite", "lien billet", "page de vente"],
    steps: [
      {
        description: {
          en: "Let me take you to Ticketing.",
          de: "Ich bringe Sie zum Ticketing.",
          fr: "Je vous emmene a la Billetterie.",
        },
        command: { type: "navigate", path: "/ticketing" },
      },
      {
        description: {
          en: "Every ticket link is a public page where customers browse and buy.",
          de: "Jeder Ticketlink ist eine oeffentliche Seite zum Stoebern und Kaufen.",
          fr: "Chaque lien est une page publique ou les clients parcourent et achetent.",
        },
        command: { type: "subtitle", text: {
          en: "Here are all your ticket links. Each one is a public page where customers browse and buy tickets.",
          de: "Hier sind all Ihre Ticketlinks. Jeder ist eine oeffentliche Seite zum Kaufen von Tickets.",
          fr: "Voici tous vos liens de billetterie. Chacun est une page publique d'achat.",
        }, duration: 5000 },
      },
      {
        description: {
          en: "This button creates a new ticket link.",
          de: "Mit diesem Button erstellen Sie einen neuen Ticketlink.",
          fr: "Ce bouton cree un nouveau lien de billetterie.",
        },
        command: { type: "highlight", target: "ticketing.createLink", duration: 5000 },
      },
    ],
  },

  {
    id: "setup-split-payment",
    name: { en: "Set Up Deposits and Split Payment", de: "Anzahlung und Ratenzahlung einrichten", fr: "Configurer acompte et paiement fractionne" },
    description: {
      en: "Let buyers pay a deposit now and the rest later.",
      de: "Kaeufer zahlen zuerst eine Anzahlung, den Rest spaeter.",
      fr: "Permettre un acompte immediat et le solde plus tard.",
    },
    area: "ticketing",
    keywords: ["split payment", "deposit", "pay later", "anzahlung", "ratenzahlung", "teilzahlung", "acompte", "paiement fractionne"],
    steps: [
      {
        description: {
          en: "Ticketing defaults live in Settings. Let me take you there.",
          de: "Die Ticketing-Voreinstellungen liegen in den Einstellungen.",
          fr: "Les valeurs par defaut de billetterie sont dans les Parametres.",
        },
        command: { type: "navigate", path: "/settings/ticketing" },
      },
      {
        description: {
          en: "Deposits are set per ticket category, with the defaults coming from here.",
          de: "Anzahlungen werden je Ticketkategorie festgelegt, die Standardwerte kommen von hier.",
          fr: "Les acomptes se definissent par categorie, avec les valeurs par defaut d'ici.",
        },
        command: { type: "subtitle", text: {
          en: "Set your defaults here, then open an event's Tickets tab and edit a category to set the deposit amount and the deadline for the remaining payment.",
          de: "Legen Sie hier die Standardwerte fest. Oeffnen Sie dann den Tickets-Tab einer Veranstaltung und bearbeiten Sie eine Kategorie, um Anzahlung und Frist fuer die Restzahlung zu setzen.",
          fr: "Definissez les valeurs par defaut ici, puis ouvrez l'onglet Billets d'un evenement et modifiez une categorie pour fixer l'acompte et l'echeance du solde.",
        }, duration: 8000 },
      },
    ],
  },

  // ─── MEMBERSHIP ─────────────────────────────────────────────────
  {
    id: "setup-membership",
    name: { en: "Set Up Memberships", de: "Mitgliedschaften einrichten", fr: "Configurer les adhesions" },
    description: {
      en: "Create membership plans for your venue.",
      de: "Mitgliedschaftsplaene fuer Ihre Location erstellen.",
      fr: "Creer des formules d'adhesion pour votre etablissement.",
    },
    area: "membership",
    keywords: ["membership", "members", "subscription", "plans", "mitgliedschaft", "mitglieder", "abo", "adhesion", "membres", "abonnement"],
    steps: [
      {
        description: {
          en: "Let me take you to the Membership section.",
          de: "Ich bringe Sie zum Mitgliederbereich.",
          fr: "Je vous emmene a la section Adhesions.",
        },
        command: { type: "navigate", path: "/membership/dashboard" },
      },
      {
        description: {
          en: "Membership plans are set up in the Plans tab.",
          de: "Mitgliedschaftsplaene richten Sie im Tab 'Plaene' ein.",
          fr: "Les formules se configurent dans l'onglet Formules.",
        },
        command: { type: "highlight", target: "membership.tab.plans", duration: 5000 },
      },
      {
        description: {
          en: "Each plan has a price, a billing period and its own benefits.",
          de: "Jeder Plan hat Preis, Abrechnungszeitraum und eigene Vorteile.",
          fr: "Chaque formule a un prix, une periode de facturation et ses avantages.",
        },
        command: { type: "subtitle", text: {
          en: "Each plan has a price, a billing period, and its own benefits: ticket discounts, member-only events, and points.",
          de: "Jeder Plan hat Preis, Abrechnungszeitraum und eigene Vorteile: Ticketrabatte, exklusive Events und Punkte.",
          fr: "Chaque formule a un prix, une periode de facturation et ses avantages : reductions, evenements reserves et points.",
        }, duration: 6000 },
      },
    ],
  },

  {
    id: "manage-members",
    name: { en: "Manage Your Members", de: "Mitglieder verwalten", fr: "Gerer vos membres" },
    description: {
      en: "View and manage your membership base.",
      de: "Ihre Mitgliederbasis ansehen und verwalten.",
      fr: "Consulter et gerer votre base de membres.",
    },
    area: "membership",
    keywords: ["view members", "member list", "manage members", "mitglieder verwalten", "mitgliederliste", "liste des membres", "gerer membres"],
    steps: [
      {
        description: {
          en: "Let me open your member list.",
          de: "Ich oeffne Ihre Mitgliederliste.",
          fr: "J'ouvre votre liste de membres.",
        },
        command: { type: "navigate", path: "/membership/members" },
      },
      {
        description: {
          en: "Search and filter to find anyone, then click through for their full history.",
          de: "Suchen und filtern Sie, und klicken Sie fuer die vollstaendige Historie.",
          fr: "Cherchez et filtrez, puis cliquez pour l'historique complet.",
        },
        command: { type: "subtitle", text: {
          en: "Use search and filters to find a member. Click anyone to see their profile, subscription and full history.",
          de: "Nutzen Sie Suche und Filter. Klicken Sie ein Mitglied an, um Profil, Abo und Historie zu sehen.",
          fr: "Utilisez la recherche et les filtres. Cliquez sur un membre pour voir son profil, son abonnement et son historique.",
        }, duration: 6000 },
      },
    ],
  },

  // ─── POS ────────────────────────────────────────────────────────
  {
    id: "setup-pos",
    name: { en: "Set Up Point of Sale", de: "Kassensystem einrichten", fr: "Configurer le point de vente" },
    description: {
      en: "Configure POS for on-site sales.",
      de: "Das Kassensystem fuer den Verkauf vor Ort einrichten.",
      fr: "Configurer la caisse pour les ventes sur place.",
    },
    area: "pos",
    keywords: ["pos", "point of sale", "register", "kasse", "kassensystem", "caisse", "point de vente"],
    steps: [
      {
        description: {
          en: "Let me take you to POS.",
          de: "Ich bringe Sie zum Kassensystem.",
          fr: "Je vous emmene au point de vente.",
        },
        command: { type: "navigate", path: "/pos" },
      },
      {
        description: {
          en: "Create outlets, add products, and review transactions here.",
          de: "Hier erstellen Sie Verkaufsstellen, Produkte und sehen Transaktionen.",
          fr: "Creez des points de vente, ajoutez des produits et suivez les transactions.",
        },
        command: { type: "subtitle", text: {
          en: "Create outlets like 'Main Bar' or 'Entrance', add products, and review transactions. Your staff run the till from the Crew app.",
          de: "Erstellen Sie Verkaufsstellen wie 'Hauptbar' oder 'Eingang', legen Sie Produkte an und pruefen Sie Transaktionen. Ihr Personal nutzt die Crew-App.",
          fr: "Creez des points de vente comme 'Bar principal', ajoutez des produits et suivez les transactions. Votre equipe encaisse depuis l'app Crew.",
        }, duration: 7000 },
      },
    ],
  },

  // ─── MARKETING ──────────────────────────────────────────────────
  {
    id: "create-campaign",
    name: { en: "Create an Email Campaign", de: "E-Mail-Kampagne erstellen", fr: "Creer une campagne email" },
    description: {
      en: "Build and send an email campaign.",
      de: "Eine E-Mail-Kampagne erstellen und versenden.",
      fr: "Creer et envoyer une campagne email.",
    },
    area: "marketing",
    keywords: ["campaign", "email", "newsletter", "kampagne", "rundmail", "campagne", "infolettre"],
    steps: [
      {
        description: {
          en: "Campaigns live in Audience, under Outreach.",
          de: "Kampagnen liegen in Audience unter Outreach.",
          fr: "Les campagnes sont dans Audience, sous Outreach.",
        },
        command: { type: "navigate", path: "/audience/outreach" },
      },
      {
        description: {
          en: "Build the email, pick who receives it, then send or schedule.",
          de: "E-Mail erstellen, Empfaenger waehlen, senden oder planen.",
          fr: "Composez l'email, choisissez les destinataires, envoyez ou planifiez.",
        },
        command: { type: "subtitle", text: {
          en: "Build the email, choose who receives it from your client list, then send it now or schedule it for later.",
          de: "Erstellen Sie die E-Mail, waehlen Sie die Empfaenger aus Ihrer Kundenliste und senden oder planen Sie sie.",
          fr: "Composez l'email, choisissez les destinataires dans votre liste clients, puis envoyez ou planifiez.",
        }, duration: 6000 },
      },
    ],
  },

  {
    id: "setup-automation",
    name: { en: "Set Up Email Automations", de: "E-Mail-Automationen einrichten", fr: "Configurer les automatisations email" },
    description: {
      en: "Create automated email sequences.",
      de: "Automatisierte E-Mail-Sequenzen erstellen.",
      fr: "Creer des sequences email automatiques.",
    },
    area: "marketing",
    keywords: ["automation", "automated email", "welcome email", "reminder", "automatisierung", "erinnerung", "automatisation", "rappel"],
    steps: [
      {
        description: {
          en: "Automations live in Audience, under Outreach.",
          de: "Automationen liegen in Audience unter Outreach.",
          fr: "Les automatisations sont dans Audience, sous Outreach.",
        },
        command: { type: "navigate", path: "/audience/outreach" },
      },
      {
        description: {
          en: "Pick a trigger, then the emails that follow it.",
          de: "Waehlen Sie einen Ausloeser und die folgenden E-Mails.",
          fr: "Choisissez un declencheur, puis les emails qui suivent.",
        },
        command: { type: "subtitle", text: {
          en: "Pick a trigger: a ticket purchase, a new membership, an approaching payment deadline. Then set the emails that follow, and how long to wait between them.",
          de: "Waehlen Sie einen Ausloeser: Ticketkauf, neue Mitgliedschaft, naeher rueckende Zahlungsfrist. Legen Sie dann die folgenden E-Mails und die Wartezeit fest.",
          fr: "Choisissez un declencheur : achat de billet, nouvelle adhesion, echeance de paiement proche. Definissez ensuite les emails et les delais.",
        }, duration: 8000 },
      },
    ],
  },

  {
    id: "manage-clients",
    name: { en: "Manage Clients and Contacts", de: "Kunden und Kontakte verwalten", fr: "Gerer clients et contacts" },
    description: {
      en: "Your contact database, segments and tags.",
      de: "Ihre Kontaktdatenbank, Segmente und Tags.",
      fr: "Votre base de contacts, segments et tags.",
    },
    area: "marketing",
    keywords: ["crm", "clients", "contacts", "leads", "pipeline", "kunden", "kontakte", "kundenbeziehungen"],
    steps: [
      {
        description: {
          en: "Your contacts live in Audience, under Clients.",
          de: "Ihre Kontakte liegen in Audience unter Kunden.",
          fr: "Vos contacts sont dans Audience, sous Clients.",
        },
        command: { type: "navigate", path: "/audience/clients" },
      },
      {
        description: {
          en: "Every buyer and member lands here automatically.",
          de: "Jeder Kaeufer und jedes Mitglied landet hier automatisch.",
          fr: "Chaque acheteur et membre arrive ici automatiquement.",
        },
        command: { type: "subtitle", text: {
          en: "Everyone who buys a ticket or joins as a member lands here automatically. Tag and segment them, then use those segments as campaign audiences.",
          de: "Wer ein Ticket kauft oder Mitglied wird, landet automatisch hier. Vergeben Sie Tags und Segmente und nutzen Sie diese als Kampagnen-Zielgruppen.",
          fr: "Toute personne qui achete un billet ou devient membre arrive ici. Taguez et segmentez, puis utilisez ces segments comme audiences de campagne.",
        }, duration: 7000 },
      },
    ],
  },

  // ─── PAYMENTS ───────────────────────────────────────────────────
  {
    id: "view-payments",
    name: { en: "Invoices, Offers and Revenue", de: "Rechnungen, Angebote und Umsatz", fr: "Factures, offres et revenus" },
    description: {
      en: "Track invoices, offers and incoming payments.",
      de: "Rechnungen, Angebote und Zahlungseingaenge verfolgen.",
      fr: "Suivre factures, offres et paiements entrants.",
    },
    area: "settings",
    keywords: ["invoice", "offer", "revenue", "payments", "rechnung", "angebot", "umsatz", "zahlungen", "facture", "offre", "revenus"],
    steps: [
      {
        description: {
          en: "Let me take you to Payments.",
          de: "Ich bringe Sie zu den Zahlungen.",
          fr: "Je vous emmene aux Paiements.",
        },
        command: { type: "navigate", path: "/payments" },
      },
      {
        description: {
          en: "Offers, invoices and their payment status all live here.",
          de: "Angebote, Rechnungen und deren Zahlungsstatus liegen hier.",
          fr: "Offres, factures et leur statut de paiement sont ici.",
        },
        command: { type: "subtitle", text: {
          en: "Create offers and invoices for clients, send them, and watch their status. Paid invoices reconcile against your Stripe payouts automatically.",
          de: "Erstellen und senden Sie Angebote und Rechnungen und verfolgen Sie deren Status. Bezahlte Rechnungen werden automatisch mit Ihren Stripe-Auszahlungen abgeglichen.",
          fr: "Creez et envoyez offres et factures, et suivez leur statut. Les factures payees sont rapprochees automatiquement de vos versements Stripe.",
        }, duration: 7000 },
      },
    ],
  },

  // ─── SETTINGS ───────────────────────────────────────────────────
  {
    id: "setup-business",
    name: { en: "Set Up Your Business Profile", de: "Unternehmensprofil einrichten", fr: "Configurer votre profil d'entreprise" },
    description: {
      en: "Configure business name, address and logo.",
      de: "Firmenname, Adresse und Logo konfigurieren.",
      fr: "Configurer nom, adresse et logo de l'entreprise.",
    },
    area: "settings",
    keywords: ["business setup", "company info", "logo", "unternehmen einrichten", "firmendaten", "profil entreprise"],
    steps: [
      {
        description: {
          en: "Let me take you to Business Settings.",
          de: "Ich bringe Sie zu den Unternehmenseinstellungen.",
          fr: "Je vous emmene aux parametres d'entreprise.",
        },
        command: { type: "navigate", path: "/settings/business" },
      },
      {
        description: {
          en: "This information appears on every ticket, invoice and public page.",
          de: "Diese Angaben erscheinen auf jedem Ticket, jeder Rechnung und jeder oeffentlichen Seite.",
          fr: "Ces informations apparaissent sur chaque billet, facture et page publique.",
        },
        command: { type: "subtitle", text: {
          en: "Fill in your business name, address, logo and contact details. This appears on every ticket, invoice and public page, so it is worth getting right once.",
          de: "Tragen Sie Firmenname, Adresse, Logo und Kontaktdaten ein. Das erscheint auf jedem Ticket, jeder Rechnung und jeder oeffentlichen Seite.",
          fr: "Renseignez nom, adresse, logo et coordonnees. Cela apparait sur chaque billet, facture et page publique.",
        }, duration: 7000 },
      },
    ],
  },

  {
    id: "connect-stripe",
    name: { en: "Connect Stripe for Payments", de: "Stripe fuer Zahlungen verbinden", fr: "Connecter Stripe pour les paiements" },
    description: {
      en: "Set up Stripe so you can accept online payments.",
      de: "Stripe einrichten, um Online-Zahlungen zu akzeptieren.",
      fr: "Configurer Stripe pour accepter les paiements en ligne.",
    },
    area: "settings",
    keywords: ["stripe", "accept payments", "credit card", "payout", "zahlungen einrichten", "kreditkarte", "auszahlung", "carte bancaire", "versement"],
    steps: [
      {
        description: {
          en: "Let me take you to Payment Settings.",
          de: "Ich bringe Sie zu den Zahlungseinstellungen.",
          fr: "Je vous emmene aux parametres de paiement.",
        },
        command: { type: "navigate", path: "/settings/payments" },
      },
      {
        description: {
          en: "Connect Stripe here. It takes about ten minutes.",
          de: "Verbinden Sie hier Stripe. Das dauert etwa zehn Minuten.",
          fr: "Connectez Stripe ici. Cela prend environ dix minutes.",
        },
        command: { type: "subtitle", text: {
          en: "Connect your Stripe account here. If you don't have one, you can create it during the process. Until this is connected, you cannot sell tickets online.",
          de: "Verbinden Sie hier Ihr Stripe-Konto. Falls Sie keines haben, koennen Sie es dabei erstellen. Ohne Verbindung koennen Sie keine Tickets online verkaufen.",
          fr: "Connectez votre compte Stripe ici. Si vous n'en avez pas, vous pouvez le creer pendant le processus. Sans cela, pas de vente en ligne.",
        }, duration: 8000 },
      },
    ],
  },

  {
    id: "setup-rooms",
    name: { en: "Set Up Rooms and Spaces", de: "Raeume und Flaechen einrichten", fr: "Configurer salles et espaces" },
    description: {
      en: "Configure your venue's rooms and capacity.",
      de: "Raeume und Kapazitaeten Ihrer Location konfigurieren.",
      fr: "Configurer les salles et capacites de votre lieu.",
    },
    area: "settings",
    keywords: ["rooms", "spaces", "venue", "capacity", "raeume", "kapazitaet", "location", "salles", "espaces", "capacite"],
    steps: [
      {
        description: {
          en: "Let me take you to Room Settings.",
          de: "Ich bringe Sie zu den Raumeinstellungen.",
          fr: "Je vous emmene aux parametres de salles.",
        },
        command: { type: "navigate", path: "/settings/rooms" },
      },
      {
        description: {
          en: "Add each real room with its capacity.",
          de: "Legen Sie jeden realen Raum mit Kapazitaet an.",
          fr: "Ajoutez chaque salle reelle avec sa capacite.",
        },
        command: { type: "subtitle", text: {
          en: "Add rooms like 'Main Hall', 'Terrace' or 'VIP Lounge', and set the capacity for each. Events are booked against a room, so this comes before your first event.",
          de: "Legen Sie Raeume wie 'Grosser Saal', 'Terrasse' oder 'VIP-Lounge' an und setzen Sie die Kapazitaet. Veranstaltungen werden auf Raeume gebucht, also kommt das vor der ersten Veranstaltung.",
          fr: "Ajoutez des salles comme 'Grande salle', 'Terrasse' ou 'Salon VIP', avec leur capacite. Les evenements sont reserves sur une salle, donc cela vient avant votre premier evenement.",
        }, duration: 8000 },
      },
    ],
  },

  {
    id: "create-floormap",
    name: { en: "Create a Floor Plan", de: "Saalplan erstellen", fr: "Creer un plan de salle" },
    description: {
      en: "Build a visual floor plan with seats and tables.",
      de: "Einen visuellen Saalplan mit Sitzen und Tischen bauen.",
      fr: "Creer un plan visuel avec sieges et tables.",
    },
    area: "floormap",
    keywords: ["floor plan", "floormap", "seating", "tables", "sitzplan", "tischplan", "saalplan", "plan de salle", "placement"],
    steps: [
      {
        description: {
          en: "Floor plans live inside a room, so let me take you to Room Settings.",
          de: "Saalplaene gehoeren zu einem Raum, also gehen wir zu den Raumeinstellungen.",
          fr: "Les plans appartiennent a une salle, allons aux parametres de salles.",
        },
        command: { type: "navigate", path: "/settings/rooms" },
      },
      {
        description: {
          en: "Open a room, then create its floor plan.",
          de: "Oeffnen Sie einen Raum und erstellen Sie dessen Saalplan.",
          fr: "Ouvrez une salle, puis creez son plan.",
        },
        command: { type: "subtitle", text: {
          en: "Open a room, then find the Floor Plan option. Drag tables, seats and objects to match your real layout. Ticket categories can then sell specific seats.",
          de: "Oeffnen Sie einen Raum und waehlen Sie die Saalplan-Option. Ziehen Sie Tische, Sitze und Objekte passend zu Ihrem echten Layout. Ticketkategorien koennen dann bestimmte Plaetze verkaufen.",
          fr: "Ouvrez une salle, puis choisissez l'option Plan de salle. Glissez tables, sieges et objets pour reproduire votre configuration reelle. Les categories peuvent ensuite vendre des places precises.",
        }, duration: 8000 },
      },
    ],
  },

  {
    id: "invite-team",
    name: { en: "Invite Team Members", de: "Teammitglieder einladen", fr: "Inviter des membres de l'equipe" },
    description: {
      en: "Add staff to your OpenEvent account and set their roles.",
      de: "Mitarbeitende hinzufuegen und Rollen vergeben.",
      fr: "Ajouter du personnel et definir leurs roles.",
    },
    area: "settings",
    keywords: ["invite", "team", "staff", "add user", "roles", "mitarbeiter einladen", "team", "rollen", "inviter", "equipe", "roles"],
    steps: [
      {
        description: {
          en: "Let me take you to Staff Settings.",
          de: "Ich bringe Sie zu den Personaleinstellungen.",
          fr: "Je vous emmene aux parametres du personnel.",
        },
        command: { type: "navigate", path: "/settings/staff" },
      },
      {
        description: {
          en: "Invite by email and pick the role that fits.",
          de: "Per E-Mail einladen und die passende Rolle waehlen.",
          fr: "Invitez par email et choisissez le role adapte.",
        },
        command: { type: "subtitle", text: {
          en: "Invite people by email and pick their role: Admin for full access, Manager, Staff, or Scanner for door staff who only check tickets.",
          de: "Laden Sie per E-Mail ein und waehlen Sie die Rolle: Admin fuer Vollzugriff, Manager, Personal oder Scanner fuer Einlasspersonal.",
          fr: "Invitez par email et choisissez le role : Admin pour l'acces complet, Manager, Personnel, ou Scanner pour le controle a l'entree.",
        }, duration: 8000 },
      },
    ],
  },

  {
    id: "quick-setup",
    name: { en: "Complete Quick Setup", de: "Schnelleinrichtung abschliessen", fr: "Terminer la configuration rapide" },
    description: {
      en: "Run through the initial setup wizard.",
      de: "Den Einrichtungsassistenten durchlaufen.",
      fr: "Parcourir l'assistant de configuration initiale.",
    },
    area: "settings",
    keywords: ["quick setup", "initial setup", "wizard", "get started", "schnelleinrichtung", "assistent", "configuration rapide", "assistant"],
    steps: [
      {
        description: {
          en: "Let me take you to Quick Setup.",
          de: "Ich bringe Sie zur Schnelleinrichtung.",
          fr: "Je vous emmene a la configuration rapide.",
        },
        command: { type: "navigate", path: "/settings/quick-setup" },
      },
      {
        description: {
          en: "It walks you through the essentials, and saves as you go.",
          de: "Sie fuehrt durch das Wesentliche und speichert dabei.",
          fr: "Elle vous guide sur l'essentiel et enregistre au fur et a mesure.",
        },
        command: { type: "subtitle", text: {
          en: "This walks you through the essentials: business details, rooms, Stripe, and your first event. Your progress is saved, so you can leave and come back.",
          de: "Das fuehrt Sie durch das Wesentliche: Firmendaten, Raeume, Stripe und Ihre erste Veranstaltung. Der Fortschritt wird gespeichert.",
          fr: "Cela couvre l'essentiel : informations d'entreprise, salles, Stripe et votre premier evenement. Votre progression est enregistree.",
        }, duration: 8000 },
      },
    ],
  },

  // ─── WEBSITE, REPORTS, STAFF, SCANNER ───────────────────────────
  {
    id: "build-website",
    name: { en: "Build Your Venue Website", de: "Website Ihrer Location bauen", fr: "Creer le site de votre lieu" },
    description: {
      en: "Create a public website with the drag-and-drop builder.",
      de: "Eine oeffentliche Website mit dem Baukasten erstellen.",
      fr: "Creer un site public avec l'editeur glisser-deposer.",
    },
    area: "website",
    keywords: ["website", "landing page", "builder", "webseite erstellen", "baukasten", "site web", "page d'accueil"],
    steps: [
      {
        description: {
          en: "Let me take you to the Website builder.",
          de: "Ich bringe Sie zum Website-Baukasten.",
          fr: "Je vous emmene a l'editeur de site.",
        },
        command: { type: "navigate", path: "/website" },
      },
      {
        description: {
          en: "Build pages from sections, then publish.",
          de: "Seiten aus Abschnitten bauen und veroeffentlichen.",
          fr: "Composez des pages par sections, puis publiez.",
        },
        command: { type: "subtitle", text: {
          en: "Add sections for your events, your venue, a gallery and contact details. Your events feed in automatically. Publish when you're ready and the site goes live.",
          de: "Fuegen Sie Abschnitte fuer Veranstaltungen, Location, Galerie und Kontakt hinzu. Ihre Veranstaltungen laufen automatisch ein. Nach dem Veroeffentlichen ist die Seite live.",
          fr: "Ajoutez des sections pour vos evenements, votre lieu, une galerie et vos coordonnees. Vos evenements s'y integrent automatiquement. Publiez et le site est en ligne.",
        }, duration: 8000 },
      },
    ],
  },

  {
    id: "view-reports",
    name: { en: "View Reports and Analytics", de: "Berichte und Auswertungen", fr: "Consulter rapports et analyses" },
    description: {
      en: "Access business reports and revenue data.",
      de: "Geschaeftsberichte und Umsatzdaten abrufen.",
      fr: "Acceder aux rapports et donnees de revenus.",
    },
    area: "analytics",
    keywords: ["reports", "analytics", "revenue", "berichte", "statistiken", "auswertung", "rapports", "statistiques"],
    steps: [
      {
        description: {
          en: "Let me take you to Reports.",
          de: "Ich bringe Sie zu den Berichten.",
          fr: "Je vous emmene aux Rapports.",
        },
        command: { type: "navigate", path: "/reports" },
      },
      {
        description: {
          en: "Revenue, ticket sales and member numbers over time.",
          de: "Umsatz, Ticketverkaeufe und Mitgliederzahlen im Zeitverlauf.",
          fr: "Revenus, ventes de billets et adhesions dans le temps.",
        },
        command: { type: "subtitle", text: {
          en: "Revenue, ticket sales and member numbers over any date range. Everything here exports to CSV if you need it in a spreadsheet.",
          de: "Umsatz, Ticketverkaeufe und Mitgliederzahlen fuer jeden Zeitraum. Alles laesst sich als CSV exportieren.",
          fr: "Revenus, ventes et adhesions sur toute periode. Tout s'exporte en CSV si besoin.",
        }, duration: 7000 },
      },
    ],
  },

  {
    id: "manage-staff",
    name: { en: "Plan Staff and Shifts", de: "Personal und Schichten planen", fr: "Planifier personnel et services" },
    description: {
      en: "Schedule who works which event.",
      de: "Planen, wer bei welcher Veranstaltung arbeitet.",
      fr: "Planifier qui travaille sur quel evenement.",
    },
    area: "team",
    keywords: ["shifts", "scheduling", "rota", "staff planning", "schichten", "dienstplan", "personalplanung", "services", "planning"],
    steps: [
      {
        description: {
          en: "Let me take you to Staff.",
          de: "Ich bringe Sie zum Personalbereich.",
          fr: "Je vous emmene au Personnel.",
        },
        command: { type: "navigate", path: "/staff" },
      },
      {
        description: {
          en: "Build shifts per event and assign your people.",
          de: "Schichten je Veranstaltung anlegen und Personen zuweisen.",
          fr: "Creez des services par evenement et affectez vos equipes.",
        },
        command: { type: "subtitle", text: {
          en: "Create shifts for an event and assign your team. They see their schedule in the Crew app, so you don't have to send it around.",
          de: "Legen Sie Schichten fuer eine Veranstaltung an und weisen Sie Ihr Team zu. Es sieht den Plan in der Crew-App.",
          fr: "Creez des services pour un evenement et affectez votre equipe. Elle voit son planning dans l'app Crew.",
        }, duration: 7000 },
      },
    ],
  },

  {
    id: "use-scanner",
    name: { en: "Check Guests In With the Scanner", de: "Gaeste mit dem Scanner einlassen", fr: "Controler les entrees avec le scanner" },
    description: {
      en: "Validate tickets at the door by scanning QR codes.",
      de: "Tickets am Einlass per QR-Code pruefen.",
      fr: "Valider les billets a l'entree en scannant les QR codes.",
    },
    area: "general",
    keywords: ["scanner", "check in", "qr code", "scan ticket", "door", "einlass", "scannen", "eintritt", "controle", "entree"],
    steps: [
      {
        description: {
          en: "Let me open the scanner.",
          de: "Ich oeffne den Scanner.",
          fr: "J'ouvre le scanner.",
        },
        command: { type: "navigate", path: "/scan" },
      },
      {
        description: {
          en: "Pick the event, then point the camera at a ticket.",
          de: "Veranstaltung waehlen und die Kamera auf ein Ticket richten.",
          fr: "Choisissez l'evenement, puis visez un billet avec la camera.",
        },
        command: { type: "subtitle", text: {
          en: "Pick the event, then point the camera at a ticket QR code. Green means valid, red means already used. Door staff only need the Scanner role.",
          de: "Waehlen Sie die Veranstaltung und richten Sie die Kamera auf den QR-Code. Gruen heisst gueltig, rot bereits benutzt. Einlasspersonal braucht nur die Scanner-Rolle.",
          fr: "Choisissez l'evenement, puis visez le QR code. Vert = valide, rouge = deja utilise. Le personnel d'entree n'a besoin que du role Scanner.",
        }, duration: 8000 },
      },
    ],
  },
];

// ── Resolution: authored (localized, target ids) -> on the wire ────

function resolveCommand(
  def: FlowDef["steps"][number]["command"],
  description: string,
  lang: Lang,
): AgentCommand {
  switch (def.type) {
    case "navigate":
      return { type: "navigate", path: def.path, subtitle: description };
    case "subtitle":
      return { type: "subtitle", text: resolveText(def.text, lang), duration: def.duration };
    case "wait":
      return { type: "wait", ms: def.ms };
    case "highlight":
    case "click":
    case "scroll":
    case "fill": {
      const target = getTarget(def.target);
      if (!target) {
        // registry.test.ts makes this unreachable in a shipped build.
        throw new Error(`Flow references unknown target id: ${def.target}`);
      }
      if (def.type === "fill") {
        return { type: "fill", selector: target.selector, label: target.label, value: def.value, subtitle: description };
      }
      if (def.type === "click") {
        return { type: "click", selector: target.selector, label: target.label, subtitle: description };
      }
      if (def.type === "scroll") {
        return { type: "scroll", selector: target.selector, label: target.label, subtitle: description };
      }
      return { type: "highlight", selector: target.selector, label: target.label, subtitle: description, duration: def.duration };
    }
  }
}

function resolveFlow(def: FlowDef, lang: Lang): Flow {
  const steps: FlowStep[] = def.steps.map((step, index) => {
    const description = resolveText(step.description, lang);
    const command = resolveCommand(step.command, description, lang);
    return { id: `${def.id}-${index + 1}`, action: command.type, command, description };
  });

  return {
    id: def.id,
    name: resolveText(def.name, lang),
    description: resolveText(def.description, lang),
    area: def.area,
    keywords: def.keywords,
    steps,
  };
}

// ── Public API ─────────────────────────────────────────────────────

/** The raw authored definitions. Used by the test suite. */
export function getFlowDefs(): FlowDef[] {
  return flows;
}

export function getAllFlows(lang: Lang = "en"): Flow[] {
  return flows.map((f) => resolveFlow(f, lang));
}

export function getFlowById(id: string, lang: Lang = "en"): Flow | undefined {
  const def = flows.find((f) => f.id === id);
  return def ? resolveFlow(def, lang) : undefined;
}

export function getFlowSummaries(lang: Lang = "en"): FlowSummary[] {
  return flows.map((f) => ({
    id: f.id,
    name: resolveText(f.name, lang),
    description: resolveText(f.description, lang),
    keywords: f.keywords,
  }));
}

export function findFlowsByKeyword(keyword: string, lang: Lang = "en"): Flow[] {
  const lower = keyword.toLowerCase();
  return flows
    .filter(
      (f) =>
        f.keywords.some((k) => k.toLowerCase().includes(lower)) ||
        resolveText(f.name, lang).toLowerCase().includes(lower),
    )
    .map((f) => resolveFlow(f, lang));
}

export function getFlowsByArea(area: FlowDef["area"], lang: Lang = "en"): Flow[] {
  return flows.filter((f) => f.area === area).map((f) => resolveFlow(f, lang));
}
