import type { CSSProperties } from "react";
import LogoMark from "@/components/logo-mark";
import { Container, SectionTitle } from "@/components/site/section";
import { Seal } from "@/components/site/shapes";
import { QR_TYPES } from "@/components/site/home/types-marquee";

const RINGS = [
  { radius: 250, duration: "70s", reverse: false, items: QR_TYPES.slice(0, 6), offset: 0 },
  { radius: 370, duration: "95s", reverse: true, items: QR_TYPES.slice(6, 12), offset: 30 },
];

/**
 * Orbit section: faint concentric rings with QR-type icon chips that
 * slowly revolve (chips counter-rotate to stay upright) around a lime
 * seal. Decorative; the heading carries the meaning.
 */
export default function Orbit() {
  return (
    <section aria-labelledby="orbit-title" className="pt-16 md:pt-[72px]">
      <Container className="text-center">
        <SectionTitle id="orbit-title" className="max-w-[640px]">
          Every kind of QR code in one place
        </SectionTitle>
      </Container>

      <div
        aria-hidden
        className="relative mx-auto mt-10 h-[230px] max-w-[1218px] overflow-hidden sm:h-[330px] md:mt-14 lg:h-[430px]"
      >
        {/* Anchor at the ring centre (bottom middle); scale the whole orbit per breakpoint. */}
        <div className="absolute bottom-[24px] left-1/2 h-0 w-0 lg:bottom-[40px]">
          <div className="h-0 w-0 scale-[0.5] sm:scale-[0.72] lg:scale-100">
            {/* Faint concentric rings */}
            {[150, 250, 370, 490].map((r) => (
              <div
                key={r}
                className="absolute rounded-full border border-stone-dark"
                style={{ width: r * 2, height: r * 2, left: -r, top: -r }}
              />
            ))}
            <div
              className="absolute rounded-full"
              style={{
                width: 980,
                height: 980,
                left: -490,
                top: -490,
                background: "radial-gradient(closest-side, rgba(240,238,235,0.9), rgba(240,238,235,0) 70%)",
              }}
            />

            {/* Revolving chip rings */}
            {RINGS.map((ring) => (
              <div
                key={ring.radius}
                className="absolute left-0 top-0 h-0 w-0 animate-spin-slow"
                style={{ animationDuration: ring.duration, animationDirection: ring.reverse ? "reverse" : "normal" }}
              >
                {ring.items.map(({ label, icon: Icon }, i) => {
                  const angle = ring.offset + (360 / ring.items.length) * i;
                  return (
                    <div
                      key={label}
                      className="absolute left-0 top-0"
                      style={{
                        transform: `rotate(${angle}deg) translateX(${ring.radius}px) rotate(${-angle}deg)`,
                      }}
                    >
                      <div
                        className="-translate-x-1/2 -translate-y-1/2"
                      >
                        <div
                          className="grid h-[84px] w-[84px] animate-spin-slow place-items-center rounded-full border border-stone-dark bg-white shadow-card sm:h-[60px] sm:w-[60px]"
                          style={
                            {
                              animationDuration: ring.duration,
                              animationDirection: ring.reverse ? "normal" : "reverse",
                            } as CSSProperties
                          }
                          title={label}
                        >
                          <Icon className="h-9 w-9 text-ink sm:h-6 sm:w-6" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Lime seal at the centre, with the Vertexa mark */}
            <div className="absolute -left-[120px] -top-[250px] h-[240px] w-[240px]">
              <Seal id="orbit-seal" className="h-full w-full" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-[76px] w-[76px] place-items-center rounded-[22px] bg-white/85 shadow-card">
                  <LogoMark className="h-11 w-11" />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper via-paper/70 to-transparent" />
      </div>
    </section>
  );
}
