import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminPropertiesPage } from '@/pages/admin/AdminPropertiesPage';
import { AdminPropertyFormPage } from '@/pages/admin/AdminPropertyFormPage';
import { AdminPendingListingsPage } from '@/pages/admin/AdminPendingListingsPage';
import { PortalLayout } from '@/pages/portal/PortalLayout';
import { PortalLoginPage } from '@/pages/portal/PortalLoginPage';
import { PortalSignupPage } from '@/pages/portal/PortalSignupPage';
import { PortalDashboardPage } from '@/pages/portal/PortalDashboardPage';
import { PortalListingsPage } from '@/pages/portal/PortalListingsPage';
import { PortalListingFormPage } from '@/pages/portal/PortalListingFormPage';
import { AgentLayout } from '@/pages/agent/AgentLayout';
import { AgentLoginPage } from '@/pages/agent/AgentLoginPage';
import { AgentDashboardPage } from '@/pages/agent/AgentDashboardPage';
import { AgentListingsPage } from '@/pages/agent/AgentListingsPage';
import { AgentListingFormPage } from '@/pages/agent/AgentListingFormPage';
import { AgentProfilePage } from '@/pages/agent/AgentProfilePage';
import { MarketingLayout } from '@/pages/marketing/MarketingLayout';
import { MarketingLoginPage } from '@/pages/marketing/MarketingLoginPage';
import { MarketingDashboardPage } from '@/pages/marketing/MarketingDashboardPage';
import { MarketingMediaPage } from '@/pages/marketing/MarketingMediaPage';
import { MarketingPropertiesPage } from '@/pages/marketing/MarketingPropertiesPage';
import { MarketingPropertyFormPage } from '@/pages/marketing/MarketingPropertyFormPage';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/properties" element={<PublicLayout><PropertiesPage /></PublicLayout>} />
        <Route path="/properties/:slug" element={<PublicLayout><PropertyDetailPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="properties/new" element={<AdminPropertyFormPage />} />
          <Route path="properties/:id/edit" element={<AdminPropertyFormPage />} />
          <Route path="listings" element={<AdminPendingListingsPage />} />
        </Route>

        {/* Portal */}
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal/signup" element={<PortalSignupPage />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboardPage />} />
          <Route path="listings" element={<PortalListingsPage />} />
          <Route path="listings/new" element={<PortalListingFormPage />} />
          <Route path="listings/:id/edit" element={<PortalListingFormPage />} />
        </Route>

        {/* Agent portal */}
        <Route path="/agent/login" element={<AgentLoginPage />} />
        <Route path="/agent" element={<AgentLayout />}>
          <Route index element={<AgentDashboardPage />} />
          <Route path="listings" element={<AgentListingsPage />} />
          <Route path="listings/new" element={<AgentListingFormPage />} />
          <Route path="listings/:id/edit" element={<AgentListingFormPage />} />
          <Route path="profile" element={<AgentProfilePage />} />
        </Route>

        {/* Marketing portal */}
        <Route path="/marketing/login" element={<MarketingLoginPage />} />
        <Route path="/marketing" element={<MarketingLayout />}>
          <Route index element={<MarketingDashboardPage />} />
          <Route path="properties" element={<MarketingPropertiesPage />} />
          <Route path="properties/new" element={<MarketingPropertyFormPage />} />
          <Route path="properties/:id/edit" element={<MarketingPropertyFormPage />} />
          <Route path="media" element={<MarketingMediaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
