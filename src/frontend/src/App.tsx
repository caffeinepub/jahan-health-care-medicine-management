import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "./components/Layout";
import type { PageKey } from "./lib/helpers";
import { BillsPayments } from "./pages/BillsPayments";
import { Dashboard } from "./pages/Dashboard";
import { Distribution } from "./pages/Distribution";
import { MedicineStock } from "./pages/MedicineStock";
import { Reports } from "./pages/Reports";
import { Suppliers } from "./pages/Suppliers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  const renderPage = () => {
    if (activePage === "dashboard") return <Dashboard />;
    if (activePage === "stock") return <MedicineStock />;
    if (activePage === "suppliers") return <Suppliers />;
    if (activePage === "bills") return <BillsPayments />;
    if (activePage.startsWith("dist-"))
      return <Distribution pageKey={activePage} />;
    if (activePage === "reports") return <Reports />;
    return <Dashboard />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activePage={activePage} onNavigate={setActivePage}>
        {renderPage()}
      </Layout>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
