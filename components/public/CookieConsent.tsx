"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface CookieConsentProps {
  primaryColor?: string;
  consentText?: string | null;
  privacyPolicyUrl?: string | null;
}

const STORAGE_KEY = "tapp_cookie_consent";

export function CookieConsent({ primaryColor = "#0ea5e9", consentText, privacyPolicyUrl }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() }));
    setVisible(false);
    // Dispatch event so analytics scripts can initialize
    window.dispatchEvent(new CustomEvent("cookieConsentAccepted"));
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, at: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-xl md:border"
    >
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          {consentText ||
            "Usamos cookies para melhorar sua experiência e analisar o tráfego do site."}
          {privacyPolicyUrl && (
            <>
              {" "}
              <a
                href={privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-gray-500 hover:text-gray-700"
              >
                Política de privacidade
              </a>
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={accept}
          >
            Aceitar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={decline}
          >
            Recusar
          </Button>
        </div>
      </div>
    </div>
  );
}
