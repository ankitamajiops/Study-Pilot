import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = { title: "StudyPilot", description: "Agentic AI study companion" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
