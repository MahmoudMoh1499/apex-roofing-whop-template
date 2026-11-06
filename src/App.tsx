import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { ServiceAreasSection } from './components/ServiceAreasSection';
import { FinancingSection } from './components/FinancingSection';
import { ReviewsAndTrustSection } from './components/ReviewsAndTrustSection';
import { EstimateFormSection } from './components/EstimateFormSection';
import { WhopCheckoutModal, CheckoutMode } from './components/WhopCheckoutModal';
import { InvoiceDemoModal } from './components/InvoiceDemoModal';
import { Footer } from './components/Footer';
import { RoofingService } from './config/roofingCompany';

export const App: React.FC = () => {
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    mode: CheckoutMode;
  }>({
    isOpen: false,
    mode: 'inspection',
  });

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [estimateServicePrefill, setEstimateServicePrefill] = useState<string | undefined>(undefined);
  const [savedCustomerInfo, setSavedCustomerInfo] = useState<{
    email?: string;
    paymentMethodId?: string;
    memberId?: string;
  }>({});

  const scrollToEstimate = (serviceTitle?: string) => {
    if (serviceTitle) {
      setEstimateServicePrefill(serviceTitle);
    }
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenInspectionCheckout = () => {
    setCheckoutModal({
      isOpen: true,
      mode: 'inspection',
    });
  };

  const handleOpenDepositCheckout = () => {
    setCheckoutModal({
      isOpen: true,
      mode: 'deposit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation */}
      <Navbar
        onOpenEstimate={() => scrollToEstimate()}
        onOpenInspectionCheckout={handleOpenInspectionCheckout}
      />

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection
          onOpenEstimate={() => scrollToEstimate()}
          onOpenInspectionCheckout={handleOpenInspectionCheckout}
        />

        <ServicesSection
          onSelectService={(service: RoofingService) => {
            if (service.checkoutType === 'inspection') {
              handleOpenInspectionCheckout();
            } else if (service.checkoutType === 'deposit') {
              handleOpenDepositCheckout();
            } else {
              scrollToEstimate(service.title);
            }
          }}
          onOpenDepositCheckout={handleOpenDepositCheckout}
          onOpenInspectionCheckout={handleOpenInspectionCheckout}
          onOpenEstimate={scrollToEstimate}
        />

        <ServiceAreasSection
          onOpenEstimate={() => scrollToEstimate()}
        />

        <FinancingSection
          onOpenEstimate={() => scrollToEstimate()}
        />

        <ReviewsAndTrustSection />

        <EstimateFormSection
          initialService={estimateServicePrefill}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenInvoiceDemo={() => setIsInvoiceModalOpen(true)}
        onOpenEstimate={() => scrollToEstimate()}
      />

      {/* Whop Elements Checkout Modal ($149 Inspection / $500 Deposit Setup Intent) */}
      <WhopCheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal({ ...checkoutModal, isOpen: false })}
        mode={checkoutModal.mode}
        onPaymentSuccess={(result) => {
          if (result.paymentMethodId || result.customerEmail) {
            setSavedCustomerInfo({
              email: result.customerEmail,
              paymentMethodId: result.paymentMethodId,
              memberId: result.memberId,
            });
          }
        }}
      />

      {/* Final Balance Invoicing Portal Modal */}
      <InvoiceDemoModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        savedPaymentMethodId={savedCustomerInfo.paymentMethodId}
        customerEmail={savedCustomerInfo.email || 'customer@example.com'}
      />
    </div>
  );
};

export default App;
