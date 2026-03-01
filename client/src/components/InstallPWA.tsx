import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;

    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Mostrar banner discreto após 5 segundos, somente se não foi dispensado
      setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (!dismissed) {
          setShowBanner(true);
        }
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (isInstalled || !deferredPrompt) return null;

  // Chip discreto — aparece no canto inferior direito acima da BottomNav
  if (showBanner) {
    return (
      <div
        className="fixed bottom-20 right-3 md:bottom-6 md:right-4 z-50 animate-in slide-in-from-bottom-3 fade-in duration-300"
        style={{ maxWidth: 260 }}
      >
        <div
          className="bg-card border border-border rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5"
          style={{ backdropFilter: "blur(8px)" }}
        >
          {/* Ícone */}
          <div
            className="flex items-center justify-center rounded-lg bg-primary/15 border border-primary/20 shrink-0"
            style={{ width: 34, height: 34 }}
          >
            <Download className="w-4 h-4 text-primary" />
          </div>

          {/* Texto + botão instalar */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground leading-tight">Instalar App Cultivo</p>
            <button
              onClick={handleInstall}
              className="text-xs text-primary hover:underline font-medium mt-0.5"
            >
              Adicionar à tela inicial
            </button>
          </div>

          {/* Fechar */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Botão flutuante mínimo quando banner foi dispensado mas ainda pode instalar
  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 right-3 md:bottom-6 md:right-4 bg-primary/90 hover:bg-primary text-primary-foreground p-2.5 rounded-full shadow-md transition-all hover:scale-105 z-40"
      aria-label="Instalar App"
      title="Instalar App Cultivo"
    >
      <Download className="w-4 h-4" />
    </button>
  );
}
