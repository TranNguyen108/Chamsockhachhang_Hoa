"use client";
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import './global.css'
import { supabase } from '@/utils/supabase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin");
      if (isAdmin !== "true") {
        router.replace('/authentication/login');
      }
    }
  }, [router]);
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={baselightTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
