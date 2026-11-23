import Reveal from "@/components/motion/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/site/buttons";
import { Container } from "@/components/site/section";
import { Diamond, FinderRing, Float, GlowDot, QuarterDisc, Seal } from "@/components/site/shapes";

/** Centred hero with faceless floating shapes around the copy. */
export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Floating shapes — larger set on desktop, two small ones on phones. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 mx-auto max-w-[1440px]">
        <Float className="left-[4%] top-[84px] hidden lg:block lg:left-[7%]" rotate="-14deg" duration="7s">
          <Seal id="hero-seal" className="h-[118px] w-[118px] lg:h-[150px] lg:w-[150px]" />
        </Float>
        <Float className="right-[4%] top-[56px] hidden lg:block lg:right-[8%]" rotate="12deg" duration="6.2s" delay="-1.6s">
          <FinderRing className="h-[96px] w-[96px] lg:h-[124px] lg:w-[124px]" />
        </Float>
        <Float className="bottom-[36px] left-[13%] hidden lg:block" rotate="-8deg" duration="8s" delay="-3s">
          <QuarterDisc className="h-[72px] w-[72px] lg:h-[96px] lg:w-[96px]" />
        </Float>
        <Float className="bottom-[56px] right-[14%] hidden lg:block" rotate="45deg" duration="5.4s" delay="-2.2s">
          <Diamond className="h-[58px] w-[58px] lg:h-[74px] lg:w-[74px]" />
        </Float>
        <Float className="right-[27%] top-[30px] hidden lg:block" duration="5s" delay="-0.8s">
          <GlowDot className="h-4 w-4" />
        </Float>

        {/* Phone: two small shapes tucked into the corners. */}
        <Float className="-left-3 top-3 lg:hidden" rotate="-14deg" duration="7s">
          <Seal id="hero-seal-sm" className="h-[64px] w-[64px]" />
        </Float>
        <Float className="-right-2 top-10 lg:hidden" rotate="45deg" duration="5.6s" delay="-2s">
          <Diamond className="h-9 w-9" />
        </Float>
      </div>

      <Container className="relative pb-14 pt-20 text-center sm:pt-24 md:pb-20 md:pt-[104px]">
        <Reveal>
          <h1
            id="hero-title"
            className="mx-auto max-w-[760px] text-balance font-heading text-[40px] font-medium leading-[1.15] tracking-[-0.025em] text-ink sm:text-[52px] md:text-[64px] md:leading-[1.2]"
          >
            QR codes, but make them editable
          </h1>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-5 max-w-[560px] text-balance font-body text-lg leading-[1.4] text-muted md:text-[21px]">
            Change the link after it&apos;s printed and watch every scan roll in
          </p>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href="/create" size="lg">
              Create QR code
            </PrimaryButton>
            <SecondaryButton href="#how" className="md:!h-12">
              See how it works
            </SecondaryButton>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
