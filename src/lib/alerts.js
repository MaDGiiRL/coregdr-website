import Swal from "sweetalert2";

// ✅ Tema dark coerente col tuo UI (Tailwind + palette custom)
const base = Swal.mixin({
    background: "#111326",
    color: "#f4f4f9",
    iconColor: "#7c5cff", // violet
    confirmButtonColor: "#4fd1c5", // accent cool/teal
    cancelButtonColor: "#2d325a",
    buttonsStyling: true,
    showClass: { popup: "swal2-show" },
    hideClass: { popup: "swal2-hide" },

    // ✅ garantisce che modali/toast stiano sopra la UI (navbar inclusa)
    // (SweetAlert2 usa già z-index alto, ma alcune navbar hanno z-50/z-100)
    customClass: {
        container: "swal2-container-high",
    },
});

const withDefaults = (opts) =>
    base.fire({
        confirmButtonText: "Ok",
        ...opts,
    });

/* ---------------------------------
   ALERT MODAL (blocca la UI)
---------------------------------- */

export const alertInfo = (title, text, footer) =>
    withDefaults({
        icon: "info",
        title,
        text,
        footer,
    });

export const alertSuccess = (title, text, footer) =>
    withDefaults({
        icon: "success",
        title,
        text,
        footer,
    });

export const alertWarning = (title, text, footer) =>
    withDefaults({
        icon: "warning",
        title,
        text,
        footer,
    });

export const alertError = (title, text, footer) =>
    withDefaults({
        icon: "error",
        title,
        text,
        footer,
    });

/* ---------------------------------
   HTML ALERT (quando passi html)
---------------------------------- */

export const alertHtml = ({ icon = "info", title, html, footer }) =>
    withDefaults({
        icon,
        title,
        html,
        footer,
    });

/* ---------------------------------
   CONFERME (true/false)
---------------------------------- */

export const confirmAction = async ({
    title = "Sei sicuro?",
    text = "Questa azione non può essere annullata.",
    confirmText = "Sì, continua",
    cancelText = "Annulla",
    icon = "warning",
    reverseButtons = true,
    danger = false, // ✅ se true il bottone conferma diventa rosso
}) => {
    const result = await base.fire({
        icon,
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        focusCancel: true,
        reverseButtons,
        confirmButtonColor: danger ? "#ef4444" : "#4fd1c5",
    });

    return result.isConfirmed;
};

/* ---------------------------------
   TOAST (non blocca la UI)
---------------------------------- */

// ✅ Altezza navbar: cambia questo valore se la tua navbar è più alta.
// Tipico: 64px (h-16) / 72px / 80px
const NAVBAR_OFFSET_PX = 72;

export const toast = (icon, title) =>
    base.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,

        // ✅ sposta il toast sotto la navbar + assicurati che stia sopra a tutto
        didOpen: (toastEl) => {
            const container = toastEl?.parentElement; // .swal2-container
            if (container) {
                container.style.marginTop = `${NAVBAR_OFFSET_PX}px`;
                container.style.zIndex = "99999";
            }
        },
    });

/* ---------------------------------
   LOADER (utile per async)
---------------------------------- */

export const showLoading = (title = "Caricamento...", text = "Attendi...") =>
    base.fire({
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            base.showLoading();
        },
    });

export const closeAlert = () => Swal.close();
