
import type { Metadata } from 'next';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'SoulyCore - Multi-Memory AI Assistant',
  description: "A fully client-side, responsive, and installable Progressive Web App (PWA) using React and TypeScript. This app serves as a chat interface for an advanced AI assistant powered by the Gemini API, featuring a sophisticated, multi-layered memory system that persists information and context across sessions within the user's browser.",
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
        <link rel="stylesheet" href="https://esm.sh/xterm@5.3.0/css/xterm.css" />
      </head>
      <body className="bg-gray-800 text-gray-100">{children}</body>
    </html>
  );
}
