"use client"

import { useState, useEffect } from "react"
import { getAboutContent, getContactContent, getLegalRightsContent, getPublicDomainTextContent } from "@/lib/actions/getGlobalSettings"
import UIElementsRouter from "./UIElementsRouter"

interface UIContent {
  aboutContent: string | null
  contactContent: string | null
  legalRightsContent: string | null
  publicDomainTextContent: string | null
}

/**
 * Client-side content loader that fetches UI content after initial render.
 * 
 * This defers non-critical content (about/contact/legal) to client-side,
 * allowing the page to render immediately without waiting for this data.
 * 
 * Content is fetched once and cached for the session.
 * Uses server actions directly (no API routes needed).
 */
export default function UIContentLoader() {
  const [content, setContent] = useState<UIContent>({
    aboutContent: null,
    contactContent: null,
    legalRightsContent: null,
    publicDomainTextContent: null,
  })

  useEffect(() => {
    // Fetch content client-side after initial render (non-blocking)
    // Use requestIdleCallback to defer until browser is idle
    const fetchContent = async () => {
      try {
        const [about, contact, legal, publicDomain] = await Promise.all([
          getAboutContent(),
          getContactContent(),
          getLegalRightsContent(),
          getPublicDomainTextContent(),
        ])

        setContent({
          aboutContent: about ?? null,
          contactContent: contact ?? null,
          legalRightsContent: legal ?? null,
          publicDomainTextContent: publicDomain ?? null,
        })
      } catch (error) {
        console.error("Failed to fetch UI content:", error)
      }
    }

    // Defer fetching until after initial render and browser is idle
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(fetchContent, { timeout: 2000 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(fetchContent, 100)
    }
  }, [])

  // Render UIElementsRouter directly with fetched content
  return (
    <UIElementsRouter
      aboutContent={content.aboutContent}
      contactContent={content.contactContent}
      legalRightsContent={content.legalRightsContent}
      publicDomainTextContent={content.publicDomainTextContent}
    />
  )
}
