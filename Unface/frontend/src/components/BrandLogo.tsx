/** Логотип «One Face» с акцентными кругами */
export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative inline-block text-center ${className}`}>
      <span
        className="absolute -left-1 top-1 w-9 h-9 rounded-full bg-brand-lime -z-0 opacity-95"
        aria-hidden
      />
      <h1 className="relative text-3xl sm:text-4xl font-bold tracking-tight text-charcoal dark:text-gray-100 leading-tight">
        <span className="block">One</span>
        <span className="block relative">
          Face
          <span
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-coral"
            aria-hidden
          />
        </span>
      </h1>
    </div>
  );
}
