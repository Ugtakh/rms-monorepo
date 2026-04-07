import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { Metadata, Viewport } from "next";
// import PwaRegister from "@/components/PWARegister";
// import PwaInstallPrompt from "@/components/PWAInstallPrompt";
// import PWAUpdateToast from "@/components/PWAUpdateToast";
// import AppVersionBadge from "@/components/AppVersionBadge";

export const metadata: Metadata = {
  title: "RERP",
  description: "Restaurant ERP POS and KDS",
  applicationName: "Restaurant POS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Restaurant POS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className={`antialiased`}>
        {/* <PwaRegister /> */}
        {/* <PwaInstallPrompt /> */}
        {/* <PWAUpdateToast /> */}
        {/* <AppVersionBadge /> */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
