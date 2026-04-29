import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div className="flex items-center gap-1.5" aria-label={m.language_label()}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => setLocale(locale)}
          aria-pressed={locale === currentLocale}
          className={cn(
            buttonVariants({
              variant: locale === currentLocale ? 'default' : 'ghost',
              size: 'xs',
            }),
          )}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
