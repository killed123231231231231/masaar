import Reveal from "@/components/motion/reveal";
import { PrimaryButton } from "@/components/site/buttons";
import { Container } from "@/components/site/section";
import { Capsule, Diamond, FinderRing, Float, GlowDot, QuarterDisc, Seal } from "@/components/site/shapes";

/** Closing call to action surrounded by floating shapes. */
export default function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-x-clip py-20 md:py-[140px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 mx-auto max-w-[1300px]">
        <Float className="left-[3%] top-[18%] hidden lg:block lg:left-[8%]" rotate="10deg" duration="7.4s" delay="-1s">
          <FinderRing className="h-[88px] w-[88px] lg:h-[110px] lg:w-[110px]" />
        </Float>
        <Float className="bottom-[14%] left-[12%] hidden lg:block lg:left-[18%]" rotate="-20deg" duration="6s" delay="-3s">
          <Capsule className="h-[44px] w-[96px]" />
        </Float>
        <Float className="right-[4%] top-[12%] hidden lg:block lg:right-[9%]" rotate="-12deg" duration="6.8s" delay="-2s">
          <Seal id="cta-seal" className="h-[110px] w-[110px] lg:h-[132px] lg:w-[132px]" />
        </Float>
        <Float className="bottom-[16%] right-[14%] hidden lg:block lg:right-[20%]" rotate="45deg" duration="5.6s" delay="-0.6s">
          <Diamond className="h-[56px] w-[56px]" />
        </Float>
        <Float className="bottom-[18%] left-[40%] hidden lg:block" rotate="-8deg" duration="8s" delay="-4s">
          <QuarterDisc className="h-[60px] w-[60px]" />
        </Float>
        <Float className="left-[30%] top-[10%] hidden lg:block" duration="5s">
          <GlowDot className="h-3.5 w-3.5" />
        </Float>

        {/* Phone */}
        <Float className="-left-4 top-4 lg:hidden" rotate="10deg" duration="7s">
          <FinderRing className="h-14 w-14" />
        </Float>
        <Float className="-right-3 bottom-6 lg:hidden" rotate="-12deg" duration="6s" delay="-2s">
          <Seal id="cta-seal-sm" className="h-16 w-16" />
        </Float>
      </div>

      <Container className="relative text-center">
        <Reveal>
          <h2
            id="cta-title"
            className="mx-auto max-w-[640px] text-balance font-heading text-[36px] font-medium leading-[1.15] tracking-[-0.02em] text-ink md:text-[54px] md:leading-[1.2]"
          >
            Start making QR codes
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-4 max-w-[480px] font-body text-lg leading-[1.4] text-muted md:text-[21px]">
            Free to start. Change them anytime.
          </p>
        </Reveal>
        <Reveal delay={160} className="mt-8 flex justify-center">
          <PrimaryButton href="/create" size="lg" filled>
            Create QR code
          </PrimaryButton>
        </Reveal>
      </Container>
    </section>
  );
}
