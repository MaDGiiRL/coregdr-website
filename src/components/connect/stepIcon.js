import {
    ShoppingCart,
    Download,
    PlugZap,
    Users,
    ClipboardCheck,
    UserPlus,
    Sparkles,
} from "lucide-react";

export const stepIcon = (id) => {
    switch (id) {
        case 1:
            return ShoppingCart;
        case 2:
            return Download;
        case 3:
            return PlugZap;
        case 4:
            return Users;
        case 5:
            return ClipboardCheck;
        case 6:
            return UserPlus;
        default:
            return Sparkles;
    }
};
