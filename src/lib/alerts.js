// src/lib/alerts.js
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

export const toast = (icon, title) =>
    base.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
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
