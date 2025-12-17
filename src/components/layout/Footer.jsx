// src/components/Footer.jsx
import logo from "../../assets/img/logo.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--color-border)]/40 bg-[#13142b]/80 backdrop-blur mt-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm text-[var(--color-text-muted)]">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Core Roleplay logo"
            className="h-6 w-6 rounded-lg object-cover"
          />
          <p>© {year} Core Roleplay — FiveM Server.</p>
        </div>
        <div className="text-[11px] flex flex-col items-center md:items-end gap-1">
          <p className="text-[10px]">
            Not affiliated with Rockstar Games or Take-Two Interactive.
          </p>
          <p className="text-[10px]">
            Developed with <span className="mx-0.5">💜</span> by{" "}
            <a
              href="https://www.linkedin.com/in/sofia-vidotto-junior-developer/"
              className="font-semibold text-[var(--color-text)]"
            >
              MaDGiiRL
            </a>{" "}
            • Backend support by{" "}
            <a
              href="https://github.com/Swerd99"
              className="font-semibold text-[var(--color-text)]"
            >
              Swerd
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
