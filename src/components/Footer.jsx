// src/components/Footer.jsx
import logo from "../assets/img/logo.png";

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

        <div className="flex flex-col items-center md:items-end gap-1">
          <p>
            Non affiliato in alcun modo con Rockstar Games o Take-Two
            Interactive.
          </p>
          <p className="text-[11px] md:text-xs">
            Developed with <span className="mx-0.5">💜</span>
            by{" "}
            <a href="https://www.linkedin.com/in/sofia-vidotto-junior-developer/">
              <span className="font-semibold text-[var(--color-text)]">
                MaDGiiRL
              </span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
