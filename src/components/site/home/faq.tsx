import type { ReactNode } from "react";
import Reveal from "@/components/motion/reveal";
import { SecondaryButton } from "@/components/site/buttons";
import { Container, SectionTitle, focusRing } from "@/components/site/section";
import FaqCard from "@/components/site/home/faq-card";

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Is Vertexa QR free?",
    a: "Yes. You can create up to 25 QR codes on one account, and you don't need a card to sign up.",
  },
  {
    q: "Can I change a QR code after it's printed?",
    a: "Yes, if it's a dynamic QR code. Change the destination in your dashboard and the printed code opens the new link. Static codes can't be changed.",
  },
  {
    q: "What's the difference between static and dynamic?",
    a: "A static code stores its content inside the pattern itself, like WiFi details or plain text. A dynamic code points to a short link we host, so you can edit it later and count its scans.",
  },
  {
    q: "What can people scan to?",
    a: "Websites, WhatsApp chats, PDFs, images, WiFi networks, contact cards, social profiles, app links, email, SMS, locations and feedback forms.",
  },
  {
    q: "Are there file size limits?",
    a: "PDFs can be up to 5 MB and images up to 2 MB. Video uploads aren't supported, so link to a YouTube video instead.",
  },
  {
    q: "Do QR codes expire?",
    a: "No. A QR code keeps working for as long as it's active in your account.",
  },
  {
    q: "How do you handle abuse?",
    a: "Destinations must be web links, and links are checked against known bad patterns when you save them. Anyone can report a code, and every report is reviewed.",
  },
  {
    q: "Who builds Vertexa QR?",
    a: (
      <>
        Vertexa, a technology company in Saudi Arabia. Learn more at{" "}
        <a
          href="https://www.vertechxa.ai"
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded font-medium text-ink underline underline-offset-4 ${focusRing}`}
        >
          vertechxa.ai
        </a>
        .
      </>
    ),
  },
];

/** FAQ in Sunbeam's testimonial-card style: three-column masonry. */
export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-16 md:py-[72px]">
      <Container>
        <SectionTitle id="faq-title">Questions, answered</SectionTitle>

        <div className="mt-8 columns-1 gap-5 md:mt-14 md:columns-2 lg:columns-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={(i % 3) * 80} className="mb-3 break-inside-avoid md:mb-5">
              <FaqCard q={f.q}>{f.a}</FaqCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex justify-center">
          <SecondaryButton href="/contact">Contact us</SecondaryButton>
        </Reveal>
      </Container>
    </section>
  );
}
