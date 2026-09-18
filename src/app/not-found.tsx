import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12">
      <div className="flex flex-col items-center gap-8 bg-white px-6 py-12 text-center sm:flex-row sm:text-left">
        <svg
          viewBox="0 0 24 24"
          className="h-[110px] w-[110px] shrink-0 text-[#d5d9d9]"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
          />
        </svg>
        <div>
          <h1 className="mb-2 text-[28px] text-ink">
            Looking for something?
          </h1>
          <p className="mb-5 text-[14px] text-[#565959]">
            We&apos;re sorry. The web address you entered is not a functioning
            page on our site.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link
              href="/"
              className="rounded-full bg-cta px-5 py-1.5 text-[14px] text-ink hover:bg-cta-hover"
            >
              Go to the home page
            </Link>
            <Link
              href="/s"
              className="rounded-full border border-line bg-white px-5 py-1.5 text-[14px] text-ink hover:bg-[#f7fafa]"
            >
              Browse all departments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
