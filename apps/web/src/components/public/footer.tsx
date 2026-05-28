import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Twitter, Facebook, Instagram, Mail } from "lucide-react";

const footerLinks = {
  sections: [
    {
      label: "News",
      href: "/articles?category=news",
    },
    {
      label: "Politics",
      href: "/articles?category=politics",
    },
    {
      label: "Education",
      href: "/articles?category=education",
    },
    {
      label: "Community",
      href: "/articles?category=community",
    },
    {
      label: "Programs",
      href: "/programs",
    },
    {
      label: "Photo News",
      href: "/articles?category=photo-news",
    },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Editorial Policy", href: "/editorial-policy" },
    { label: "Advertise", href: "/advertise" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

const socials = [
  { icon: Twitter, href: "https://twitter.com/pentimes", label: "Twitter" },
  { icon: Facebook, href: "https://facebook.com/pentimes", label: "Facebook" },
  {
    icon: Instagram,
    href: "https://instagram.com/pentimes",
    label: "Instagram",
  },
  { icon: Mail, href: "mailto:editor@pentimes.ng", label: "Email" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-900 dark:bg-ink-900 text-white mt-16">
      {/* Main footer */}
      <div className="max-w-container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-sm flex items-center justify-center">
                <span className="text-ink-900 font-serif font-black text-sm leading-none">
                  P
                </span>
              </div>
              <div>
                <span className="font-serif font-black text-xl tracking-tight text-white">
                  Pen Times
                </span>
                <span className="block text-[0.55rem] uppercase tracking-[0.2em] text-white/50 leading-none mt-0.5">
                  Magazine
                </span>
              </div>
            </Link>
            <p className="text-caption text-white/60 leading-relaxed mb-4">
              Katsina&apos;s most trusted source for news, politics, education,
              and community development. Keeping you informed since 2024.
            </p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-md bg-white/10 hover:bg-amber-500 hover:text-ink-900 flex items-center justify-center transition-colors text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-caption font-semibold uppercase tracking-widest text-white/50 mb-4">
              Sections
            </h4>
            <ul className="space-y-2">
              {footerLinks.sections.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-caption text-white/70 hover:text-amber-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-caption font-semibold uppercase tracking-widest text-white/50 mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-caption text-white/70 hover:text-amber-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-caption font-semibold uppercase tracking-widest text-white/50 mb-4">
              Stay Updated
            </h4>
            <p className="text-caption text-white/60 mb-4">
              Get the latest stories delivered to your inbox. No spam, just
              quality journalism.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 h-8 px-3 rounded-md bg-white/10 border border-white/20 text-caption text-white placeholder:text-white/40 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="h-8 px-3 bg-amber-500 hover:bg-amber-400 text-ink-900 text-caption font-semibold rounded-md transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <Separator className="bg-white/10 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-caption text-white/40">
            © {year} Pen Times Magazine. All rights reserved.
          </p>
          <div className="flex gap-4">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-caption text-white/40 hover:text-white/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
