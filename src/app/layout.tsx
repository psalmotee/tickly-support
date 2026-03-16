import type React from "react";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Tickly - Ticket Management System",
  description:
    "Streamline your workflow with Tickly - a modern ticket management system",
    icons: {
    icon: "/ticket.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </body>
    </html>
  );
}
