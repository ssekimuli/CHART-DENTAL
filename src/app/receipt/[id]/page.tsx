"use client";

import { notFound, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Patient } from '@/lib/types';
import { getInvoiceById, getPatientById } from '@/lib/api';
import moment from 'moment';
import { useCurrency } from '@/hooks/use-currency';
import { Loader2 } from 'lucide-react';

export default function ReceiptPage() {
  const params = useParams();
  const { id } = params;
  const { formatCurrency: baseFormatCurrency } = useCurrency();
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');

  useEffect(() => {
    if (typeof id !== 'string') {
      notFound();
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const invoiceData = await getInvoiceById(id as string);
        if (invoiceData) {
          setInvoice(invoiceData);
          if (invoiceData.patientId) {
            try {
              const patientData = await getPatientById(invoiceData.patientId);
              setPatient(patientData);
            } catch (pErr) {
              console.warn('Could not load patient details for receipt:', pErr);
            }
          }
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import to avoid Next.js SSR window errors
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('receipt-content');
      
      const opt = {
        margin:       0,
        filename:     `Receipt-${invoice?.receiptNumber || invoice?.id || 'doc'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: paperSize === '58mm' ? [58, 200] : [80, 200], orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  useEffect(() => {
    // Removed auto-print as many mobile browsers block iframe printing without a user gesture.
    // The user will now tap the 'Print Receipt' button.
  }, [isLoading, invoice]);

  const formatCurrency = (value: any) => baseFormatCurrency(value, invoice?.branch?.currency);

  const treatments = useMemo(() => {
    if (!invoice) return [];
    return invoice.treatments || [];
  }, [invoice]);

  const subtotal = useMemo(() => {
    return treatments.reduce((sum, t) => {
      const cost = typeof t.cost === 'string' ? parseFloat(t.cost) : (t.cost || 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
  }, [treatments]);

  const otherChargesTotal = useMemo(() => {
    if (!invoice || !invoice.otherCharges) return 0;
    return invoice.otherCharges.reduce((sum, charge) => {
      const amount = typeof charge.amount === 'string' ? parseFloat(charge.amount) : (charge.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
            @page {
                margin: 0;
                size: auto;
            }
            body {
                margin: 0;
            }
        }
        body {
            background: #fff;
            color: #000;
        }
        .no-print {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: #f8f9fa;
        }
        .paper-toggle {
            display: flex;
            gap: 10px;
        }
        .paper-toggle button {
            padding: 8px 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
            background: #fff;
            font-weight: bold;
        }
        .paper-toggle button.active {
            background: #000;
            color: #fff;
            border-color: #000;
        }
        .print-btn {
            padding: 10px 20px;
            background-color: #000;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            max-width: 200px;
        }
        .receipt-container {
            width: 100%;
            max-width: ${paperSize};
            margin: 0 auto;
            padding: ${paperSize === '58mm' ? '5px' : '10px'};
            font-family: monospace;
            font-size: ${paperSize === '58mm' ? '10px' : '12px'};
            line-height: 1.4;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .flex { display: flex; justify-content: space-between; }
        .border-b { border-bottom: 1px dashed #000; margin-bottom: 5px; padding-bottom: 5px; }
        .border-t { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
        .mb-2 { margin-bottom: 8px; }
        .mt-2 { margin-top: 8px; }
      `}} />
      
      <div className="no-print">
         <div className="paper-toggle">
            <button 
              className={paperSize === '80mm' ? 'active' : ''} 
              onClick={() => setPaperSize('80mm')}
            >
              80mm Paper
            </button>
            <button 
              className={paperSize === '58mm' ? 'active' : ''} 
              onClick={() => setPaperSize('58mm')}
            >
              58mm Paper
            </button>
         </div>
         <div className="flex gap-2 w-full max-w-[200px] flex-col">
             <button onClick={() => handlePrint()} className="print-btn">
                 Print Receipt
             </button>
             <button onClick={() => handleDownloadPDF()} className="print-btn" style={{ background: '#3b82f6' }}>
                 Download PDF
             </button>
         </div>
      </div>

      <div className="receipt-container" id="receipt-content">
        <div className="text-center mb-2">
            <h2 className="font-bold" style={{ fontSize: '16px', margin: '0 0 4px 0' }}>{invoice.branch?.name || 'CHART DENTAL'}</h2>
            <div>{invoice.branch?.address || ''}</div>
            {invoice.branch?.contactNumber && <div>Tel: {invoice.branch.contactNumber}</div>}
        </div>

        <div className="border-b">
            <div>Receipt No: {invoice.receiptNumber || invoice.id}</div>
            <div>Date: {moment().format('DD/MM/YYYY HH:mm')}</div>
            <div>Patient: {invoice.patientName || 'Walk-in'}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
            <thead>
                <tr className="border-b">
                    <th className="text-left font-bold" style={{ width: '60%' }}>Item</th>
                    <th className="text-right font-bold" style={{ width: '40%' }}>Amount</th>
                </tr>
            </thead>
            <tbody>
                {treatments.map((t, idx) => (
                    <tr key={idx}>
                        <td className="text-left py-1">{t.procedure}</td>
                        <td className="text-right py-1">{formatCurrency(t.cost)}</td>
                    </tr>
                ))}
                {invoice.otherCharges && invoice.otherCharges.map((c, idx) => (
                    <tr key={`charge-${idx}`}>
                        <td className="text-left py-1">{c.description}</td>
                        <td className="text-right py-1">{formatCurrency(c.amount)}</td>
                    </tr>
                ))}
                {treatments.length === 0 && (!invoice.otherCharges || invoice.otherCharges.length === 0) && (
                    <tr>
                        <td className="text-left py-1">Medical / Dental Service</td>
                        <td className="text-right py-1">{formatCurrency(invoice.amount)}</td>
                    </tr>
                )}
            </tbody>
        </table>

        <div className="border-t mt-2">
            <div className="flex">
                <span>Subtotal:</span>
                <span>{formatCurrency((subtotal + otherChargesTotal) > 0 ? (subtotal + otherChargesTotal) : invoice.amount)}</span>
            </div>
            {invoice.discount ? (
                <div className="flex">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount)}</span>
                </div>
            ) : null}
            {invoice.tax ? (
                <div className="flex">
                    <span>Tax:</span>
                    <span>+{formatCurrency(invoice.tax)}</span>
                </div>
            ) : null}
            <div className="flex font-bold mt-1" style={{ fontSize: '14px' }}>
                <span>Total:</span>
                <span>{formatCurrency(invoice.amount)}</span>
            </div>
        </div>

        <div className="border-t mt-2">
            <div className="flex">
                <span>Amount Paid:</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex font-bold">
                <span>Balance:</span>
                <span>{formatCurrency(invoice.amount - invoice.paidAmount)}</span>
            </div>
        </div>

        <div className="text-center mt-2 border-t pt-2">
            <div>Thank you for your visit!</div>
            <div>Get well soon.</div>
        </div>
      </div>
    </>
  );
}
