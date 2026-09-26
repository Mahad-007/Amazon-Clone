"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";

/**
 * The storefront reads everything from Postgres, so a database hiccup
 * surfaces here instead of as a blank page. Retry re-renders the segment.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="pt-10 md:pt-16">
      <section className="brut bg-pink px-6 py-12 md:px-12">
        <Sticker tone="ink">Something broke</Sticker>
        <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[0.95] tracking-tight md:text-[60px]">
          We dropped the box.
        </h1>
        <p className="mt-4 max-w-md text-[17px]">
          This page couldn’t load its data. It’s usually a blip; trying again tends to fix it.
        </p>
        {error.digest && <p className="mt-3 font-mono text-[12px]">Ref: {error.digest}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to the front
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
