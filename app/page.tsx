import Image from "next/image";
import Link from "next/link";

type Section = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  align: "left" | "right";
};

const sections: Section[] = [
  {
    title: "FASHION",
    subtitle: "Style. Elegance. Impact.",
    href: "/portfolio/fashion",
    image: "/images/fashion.jpg",
    align: "left",
  },
  {
    title: "FOOD",
    subtitle: "Delicious. Inviting. Artful.",
    href: "/portfolio/food",
    image: "/images/food.jpg",
    align: "right",
  },
  {
    title: "COMMERCIAL REAL ESTATE",
    subtitle: "Spaces that sell.",
    href: "/portfolio/commercial-real-estate",
    image: "/images/real-estate.jpg",
    align: "left",
  },
  {
    title: "GRAPHIC DESIGN",
    subtitle: "Creative. Strategic. Bold.",
    href: "/portfolio/design",
    image: "/images/design.jpg",
    align: "right",
  },
];

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.25em]">
          BRIGHT LINE <span className="font-normal opacity-70">PHOTOGRAPHY</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm uppercase tracking-widest opacity-90 md:flex">
          <Link href="#portfolio" className="hover:opacity-70">
            Portfolio
          </Link>
          <Link href="/services" className="hover:opacity-70">
            Services
          </Link>
          <Link href="/about" className="hover:opacity-70">
            About
          </Link>
          <Link href="/contact" className="hover:opacity-70">
            Contact
          </Link>
        </nav>

        <Link
          href="/contact"
          className="rounded border border-white/20 px-3 py-2 text-xs uppercase tracking-widest hover:border-white/40 md:hidden"
        >
          Contact
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[340px] w-full overflow-hidden md:h-[420px]">
        <Image
          src="/images/hero.jpg"
          alt="Bright Line hero"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl items-center px-4">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-wide md:text-5xl">
                CAPTURING VISUAL EXCELLENCE
              </h1>
              <p className="mt-3 text-sm tracking-wide opacity-80 md:text-base">
                Photography&nbsp;&nbsp;|&nbsp;&nbsp;Design&nbsp;&nbsp;|&nbsp;&nbsp;Branding
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Band({ title, subtitle, href, image, align }: Section) {
  const isLeft = align === "left";

  return (
    <section className="relative overflow-hidden border-t border-white/10">
      {/* This wrapper MUST be relative for Image fill */}
      <div className="relative h-[180px] md:h-[210px]">
        <Image
          src={image}
          alt={title}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
      </div>

      {/* Overlay content */}
      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className={isLeft ? "max-w-md text-left" : "ml-auto max-w-md text-right"}>
            <h2 className="text-xl font-semibold tracking-widest md:text-2xl">
              {title}
            </h2>
            <p className="mt-2 text-sm opacity-80">{subtitle}</p>

            <div className={isLeft ? "mt-4" : "mt-4 flex justify-end"}>
              {/* re-enable clicks */}
              <Link
                href={href}
                className="pointer-events-auto inline-flex items-center justify-center rounded border border-white/25 px-4 py-2 text-xs uppercase tracking-widest hover:border-white/50"
              >
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h3 className="text-xl font-semibold tracking-wide md:text-2xl">
          Let&apos;s Create Something Exceptional.
        </h3>
        <p className="mt-2 text-sm opacity-80">Get in touch today.</p>

        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded border border-white/25 px-6 py-3 text-xs uppercase tracking-widest hover:border-white/50"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />

      <main id="portfolio" className="mx-auto max-w-6xl">
        {sections.map((s) => (
          <Band key={s.title} {...s} />
        ))}
      </main>

      <CTA />

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-4 text-xs uppercase tracking-widest opacity-60">
          © {new Date().getFullYear()} Bright Line Photography
        </div>
      </footer>
    </div>
  );
}
