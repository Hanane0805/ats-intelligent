import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

export const metadata = {
  title: 'ATS Intelligent',
  description: 'Système de Recrutement Intelligent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full bg-background">
      <body className="h-full antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}