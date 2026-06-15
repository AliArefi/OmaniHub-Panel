export type SupportedLocale = 'ar' | 'en'

export type LocaleDirection = 'rtl' | 'ltr'

export type LocaleMeta = {
    locale: SupportedLocale
    fallback_locale: SupportedLocale
    missing_translations?: string[]
    used_fallback?: boolean
}

export type LocalizedContent<TFields extends string> = Partial<
    Record<SupportedLocale, Partial<Record<TFields, string | null>>>
>

export type AgencyLocalizedField =
    | 'title'
    | 'about_text'
    | 'about_us'
    | 'address'
    | 'h1'
    | 'meta_title'
    | 'meta_description'
    | 'canonical'
    | 'og_title'
    | 'og_description'

export type ServiceLocalizedField =
    | 'name'
    | 'title'
    | 'h1'
    | 'h2'
    | 'body'
    | 'body2'
    | 'meta_title'
    | 'meta_description'
    | 'url_pattern'
    | 'city_url_pattern'

export type AgencyServiceLocalizedField =
    | 'title'
    | 'sub_title'
    | 'description'
    | 'about_text'
    | 'body'
    | 'h1'
    | 'meta_description'
