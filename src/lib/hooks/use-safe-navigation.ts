'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Detects if the page has been modified by a browser translation tool
 * (Google Translate, Edge Translate, etc.)
 */
function isPageTranslated(): boolean {
  if (typeof document === 'undefined') return false

  const html = document.documentElement

  // Google Translate adds class "translated-ltr" or "translated-rtl"
  if (html.classList.contains('translated-ltr') || html.classList.contains('translated-rtl')) {
    return true
  }

  // Google Translate also changes the lang attribute
  if (html.getAttribute('lang') !== html.dataset.originalLang && html.dataset.originalLang) {
    return true
  }

  // Check for Google Translate bar iframe
  if (document.querySelector('.skiptranslate, #goog-gt-tt, .goog-te-banner-frame')) {
    return true
  }

  // Check for translated font tags injected by browser translators
  if (document.querySelector('font[style*="vertical-align: inherit"]')) {
    return true
  }

  return false
}

/**
 * A navigation hook that falls back to hard navigation when the page
 * has been translated by browser tools, preventing DOM corruption crashes.
 */
export function useSafeNavigation() {
  const router = useRouter()

  const navigate = useCallback((href: string) => {
    if (isPageTranslated()) {
      // Use hard navigation to avoid React DOM mismatch errors
      window.location.href = href
    } else {
      router.push(href)
    }
  }, [router])

  return { navigate }
}
