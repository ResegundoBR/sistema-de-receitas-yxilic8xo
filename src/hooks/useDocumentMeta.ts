import { useEffect } from 'react'

export interface DocumentMeta {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Atualiza o título da aba e as meta tags og/twitter/canonical do head.
 * O servidor já serve OG tags para crawlers (routes.pb.js); este hook
 * complementa no cliente (título da aba + Google, que executa JS).
 */
export function useDocumentMeta({ title, description, image, url, type }: DocumentMeta): void {
  useEffect(() => {
    const previousTitle = document.title

    if (title) {
      document.title = title
      upsertMeta('property', 'og:title', title)
      upsertMeta('name', 'twitter:title', title)
    }
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
    }
    if (url) {
      upsertMeta('property', 'og:url', url)
      upsertLink('canonical', url)
    }
    if (type) {
      upsertMeta('property', 'og:type', type)
    }
    upsertMeta('property', 'og:site_name', 'Rodela')
    upsertMeta('property', 'og:locale', 'pt_BR')
    upsertMeta('name', 'twitter:card', 'summary_large_image')

    return () => {
      document.title = previousTitle
    }
  }, [title, description, image, url, type])
}
