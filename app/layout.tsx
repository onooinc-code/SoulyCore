import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SoulyCore - Multi-Memory AI Assistant',
  description: 'An advanced, full-stack AI assistant with a persistent, intelligent memory system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className="bg-gray-800 text-gray-100">{children}</body>
    </html>
  );
}
