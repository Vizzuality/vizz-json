import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div
      className="flex items-center gap-2"
      aria-label={m.language_label()}
    >
      <span className="text-sm text-muted-foreground">
        {m.current_locale({ locale: currentLocale })}
      </span>
      <div className="flex gap-1">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => setLocale(locale)}
            aria-pressed={locale === currentLocale}
            className={cn(
              buttonVariants({
                variant: locale === currentLocale ? 'default' : 'ghost',
                size: 'sm',
              }),
            )}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
