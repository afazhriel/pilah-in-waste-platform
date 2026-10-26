"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  Recycle,
  Scale,
  QrCode,
  FileBarChart,
  ShieldCheck,
  Sparkles,
  ArrowUp,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--primary) 15%, transparent);
}

.footer-giant-bg-text {
  font-size: clamp(16vw, 22vw, 28rem);
  line-height: 0.78;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 7%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 12%, transparent) 0%, transparent 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 45%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 8px 24px color-mix(in oklch, var(--background) 65%, transparent));
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight),
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px color-mix(in oklch, var(--foreground) 20%, transparent);
}

.footer-giant-card {
  background: linear-gradient(165deg, color-mix(in oklch, var(--foreground) 4%, transparent) 0%, color-mix(in oklch, var(--foreground) 1%, transparent) 100%);
  border: 1px solid color-mix(in oklch, var(--foreground) 9%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 
      0 32px 72px -20px color-mix(in oklch, var(--background) 85%, transparent), 
      inset 0 1px 1px color-mix(in oklch, var(--foreground) 10%, transparent);
}

.footer-marquee-track {
  display: flex;
  width: max-content;
  animation: footer-marquee 34s linear infinite;
}

@keyframes footer-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--primary) 50%, transparent)); }
  15% { transform: scale(1.18); filter: drop-shadow(0 0 12px color-mix(in oklch, var(--primary) 80%, transparent)); }
  30% { transform: scale(1); }
  45% { transform: scale(1.12); filter: drop-shadow(0 0 8px color-mix(in oklch, var(--primary) 65%, transparent)); }
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2.4s infinite ease-in-out;
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
    children?: React.ReactNode;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.32,
            y: y * 0.32,
            rotationX: -y * 0.1,
            rotationY: x * 0.1,
            scale: 1.04,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.1,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as EventListener);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as EventListener);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef)
            (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-10 px-5">
    <span>PILAH.IN SMART WASTE BANKING</span>
    <span className="text-primary/70">✦</span>
    <span>DALAM NAUNGAN HAFI DIGITAL</span>
    <span className="text-secondary/70">✦</span>
    <span>TELEMETRI TIMBANGAN IOT PRESISI</span>
    <span className="text-primary/70">✦</span>
    <span>IDENTIFIKASI QR KARTU NASABAH</span>
    <span className="text-secondary/70">✦</span>
    <span>EKONOMI SIRKULAR TRANSPARAN</span>
    <span className="text-primary/70">✦</span>
  </div>
);

export interface CinematicFooterProps {
  onNavigateTab?: (tab: any) => void;
  branchName?: string;
}

export function CinematicFooter({
  onNavigateTab,
  branchName = "Bank Sampah Pilah.in Pusat",
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      if (giantTextRef.current) {
        gsap.fromTo(
          giantTextRef.current,
          { y: "3vh", scale: 0.96, opacity: 0.65 },
          {
            y: "0vh",
            scale: 1,
            opacity: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: "top 95%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      if (headingRef.current && linksRef.current) {
        gsap.fromTo(
          [headingRef.current, linksRef.current],
          { y: 18, opacity: 0.85 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: "top 95%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden no-print rounded-t-3xl mt-6"
      >
        <footer className="cinematic-footer-wrapper relative min-h-[560px] w-full bg-background text-foreground flex flex-col justify-between overflow-hidden select-none border-t border-border/50">
          {/* Ambient Background Glows */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="footer-bg-grid absolute inset-0 opacity-20" />
            <div className="footer-aurora absolute -top-1/3 left-1/2 -translate-x-1/2 w-[130vw] h-[70vh] rounded-[100%] blur-[120px] opacity-20" />
          </div>

          {/* Giant Background Brand Watermark */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[3vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none font-black select-none"
          >
            PILAH.IN
          </div>

          {/* 1. Diagonal Sleek Marquee */}
          <div className="relative z-10 w-full py-3.5 bg-background/60 backdrop-blur-md border-y border-border/50 overflow-hidden mt-8 -rotate-1 scale-105 shadow-xl">
            <div className="footer-marquee-track text-[11px] font-black tracking-[0.28em] text-muted-foreground uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Central Content Block */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full text-center">
            <div className="footer-giant-card w-full rounded-[2rem] p-8 md:p-12 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Hafi Digital Attribution Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-primary mb-5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Dalam Naungan Hafi Digital · {branchName}</span>
              </div>

              <h2
                ref={headingRef}
                className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 footer-text-glow leading-[1.06]"
              >
                Kelola sirkulasi sampah pintar bersama Pilah.in.
              </h2>

              <p className="max-w-xl text-xs sm:text-sm text-muted-foreground mb-8 leading-relaxed">
                Platform terpadu penimbangan IoT presisi, pemindaian QR kartu nasabah digital,
                tabungan sirkular, dan pelaporan audit real-time di bawah naungan{" "}
                <span className="text-foreground font-semibold">Hafi Digital</span>.
              </p>

              {/* Magnetic Action & Module Shortcuts */}
              <div
                ref={linksRef}
                className="flex flex-wrap justify-center gap-3 w-full"
              >
                <MagneticButton
                  as="button"
                  type="button"
                  onClick={() => onNavigateTab?.("setoran")}
                  className="footer-glass-pill px-6 py-3.5 rounded-full text-foreground font-bold text-xs md:text-sm flex items-center gap-2.5 group/btn"
                >
                  <QrCode className="w-4 h-4 text-primary transition-colors" />
                  <span>Scan QR & Setoran</span>
                </MagneticButton>

                <MagneticButton
                  as="button"
                  type="button"
                  onClick={() => onNavigateTab?.("timbangan")}
                  className="footer-glass-pill px-6 py-3.5 rounded-full text-foreground font-bold text-xs md:text-sm flex items-center gap-2.5 group/btn"
                >
                  <Scale className="w-4 h-4 text-primary transition-colors" />
                  <span>Stasiun Timbangan IoT</span>
                </MagneticButton>

                <MagneticButton
                  as="button"
                  type="button"
                  onClick={() => onNavigateTab?.("laporan")}
                  className="footer-glass-pill px-6 py-3.5 rounded-full text-foreground font-bold text-xs md:text-sm flex items-center gap-2.5 group/btn"
                >
                  <FileBarChart className="w-4 h-4 text-primary transition-colors" />
                  <span>Ekspor PDF & Excel</span>
                </MagneticButton>
              </div>

              <div className="w-full max-w-lg h-[1px] bg-gradient-to-r from-transparent via-border to-transparent my-7" />

              {/* Secondary Module Pills */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {[
                  { label: "Ringkasan Eksekutif", tab: "overview" },
                  { label: "Direktori Nasabah", tab: "nasabah" },
                  { label: "Tabungan Digital", tab: "tabungan" },
                  { label: "Inventaris Gudang", tab: "inventaris" },
                  { label: "Laporan Keuangan", tab: "keuangan" },
                  { label: "Kalibrasi IoT", tab: "perangkat" },
                ].map((navItem) => (
                  <MagneticButton
                    key={navItem.tab}
                    as="button"
                    type="button"
                    onClick={() => onNavigateTab?.(navItem.tab)}
                    className="footer-glass-pill px-4 py-1.5 rounded-full text-muted-foreground hover:text-foreground text-[11px] font-medium"
                  >
                    {navItem.label}
                  </MagneticButton>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar */}
          <div className="relative z-20 w-full pb-7 px-6 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase order-2 md:order-1 flex items-center gap-2">
              <Recycle className="h-3.5 w-3.5 text-primary" />
              <span>© {new Date().getFullYear()} PILAH.IN · HAK CIPTA DILINDUNGI</span>
            </div>

            <div className="footer-glass-pill px-4 py-2 rounded-full flex items-center gap-2 order-1 md:order-2 border-border/60">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                DIKEMBANGKAN OLEH
              </span>
              <span className="animate-footer-heartbeat text-primary inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-foreground font-black text-xs tracking-normal">
                Dalam Naungan Hafi Digital
              </span>
            </div>

            <div className="order-3 md:order-3">
              <MagneticButton
                as="button"
                type="button"
                onClick={scrollToTop}
                aria-label="Kembali ke atas"
                className="footer-glass-pill w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground group"
              >
                <ArrowUp className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform duration-300" />
              </MagneticButton>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
