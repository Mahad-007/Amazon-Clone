import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <Container className="pt-10 md:pt-16">
      <section className="brut relative overflow-hidden bg-sky px-6 py-12 md:px-12 md:py-16">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-10" />
        <div className="relative grid items-center gap-10 md:grid-cols-[auto_1fr]">
          <p
            aria-hidden="true"
            className="-rotate-3 select-none border-[3px] border-ink bg-card px-5 font-display text-[110px] font-extrabold leading-none tracking-[-0.06em] shadow-brut-lg md:text-[180px]"
          >
            404
          </p>
          <div>
            <Sticker tone="pink">Lost in the aisles</Sticker>
            <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[0.95] tracking-tight md:text-[60px]">
              This shelf is empty.
            </h1>
            <p className="mt-4 max-w-md text-[17px]">
              The page you wanted isn’t here. It may have moved, or the link had a typo. The rest of the store is still
              open.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/" size="lg">
                Back to the front
              </ButtonLink>
              <ButtonLink href="/s" variant="secondary" size="lg">
                Search everything
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
