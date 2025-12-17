import { Shield, Crown, Wrench, Users } from "lucide-react";

export const STAFF = [
    {
        id: "s1",
        name: "Nome Cognome",
        role: "Founder",
        icon: Crown,
        badge: "Direzione",
        description: "Placeholder: descrizione breve dello staff member.",
    },
    {
        id: "s2",
        name: "Nome Cognome",
        role: "Co-Founder",
        icon: Crown,
        badge: "Direzione",
        description: "Placeholder: descrizione breve dello staff member.",
    },
    {
        id: "s3",
        name: "Nome Cognome",
        role: "Admin",
        icon: Shield,
        badge: "Staff",
        description: "Placeholder: gestione server, regole, moderazione.",
    },
    {
        id: "s4",
        name: "Nome Cognome",
        role: "Moderator",
        icon: Users,
        badge: "Staff",
        description: "Placeholder: supporto community e gestione ticket.",
    },
    {
        id: "s5",
        name: "Nome Cognome",
        role: "Developer",
        icon: Wrench,
        badge: "Tech",
        description: "Placeholder: sviluppo script, fix e ottimizzazioni.",
    },
];

export const FILTERS = ["Tutti", "Direzione", "Staff", "Tech"];
