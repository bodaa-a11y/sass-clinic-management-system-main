/**
 * Skip to Content Component
 * يسمح للمستخدمين باستخدام keyboard navigation بتخطي المحتوى غير الضروري
 * WCAG 2.1 AA compliant
 */

'use client'

import { Button } from '@/components/ui/button-redesigned'

export function SkipToContent() {
  return (
    <>
      <style jsx>{`
        .skip-to-content {
          position: fixed;
          top: -100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          padding: 1rem 2rem;
          background: #0066CC;
          color: white;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          transition: top 0.3s ease;
        }

        .skip-to-content:focus {
          top: 1rem;
          outline: 3px solid #000;
          outline-offset: 2px;
        }
      `}</style>
      <a
        href="#main-content"
        className="skip-to-content"
        onClick={(e) => {
          e.preventDefault()
          const main = document.getElementById('main-content')
          if (main) {
            main.focus()
            main.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }}
      >
        تخطي إلى المحتوى الرئيسي
      </a>
    </>
  )
}
