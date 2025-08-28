// src/app/layout.jsx
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ClientWrapper from "@/components/ClientWrapper";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Toaster } from "sonner";
import FloatingShapes from "@/components/floating-shapes";
import SidebarProvider from "@/components/SidebarProvider";
// import AuthDebug from "@/components/AuthDebug"; // Commented out for production
// import ProfileTest from "@/components/ProfileTest"; // Commented out for production

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Ramasamy Exports",
  description: "Onion Export Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-900`}> 
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <div className="flex flex-col min-h-screen relative">
                <FloatingShapes />
                <div className="z-10 flex flex-col min-h-screen">
                  <AppHeader />
                  <ClientWrapper>
                    {children}
                  </ClientWrapper>
                  <AppFooter />
                </div>
              </div>
              {/* Debug components commented out for production */}
              {/* <AuthDebug /> */}
              {/* <ProfileTest /> */}
            </SidebarProvider>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
