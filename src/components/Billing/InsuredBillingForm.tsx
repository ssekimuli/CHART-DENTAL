import React, { useState } from 'react';
import { insuranceApi } from '../../services/api/insurance';

interface Props {
  patientId: number;
  patientPolicyId: number;
  availableProcedures: Array<{id: number, name: string, price: number}>;
  onInvoiceCreated: (invoiceId: number) => void;
}

export const InsuredBillingForm: React.FC<Props> = ({ patientId, patientPolicyId, availableProcedures, onInvoiceCreated }) => {
  const [selectedProcedures, setSelectedProcedures] = useState<Array<{procedure_id: number, quantity: number}>>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAddProcedure = (procedureId: number) => {
    setSelectedProcedures([...selectedProcedures, { procedure_id: procedureId, quantity: 1 }]);
  };

  const getEstimate = async () => {
    setLoading(true);
    try {
      const res = await insuranceApi.getBillingEstimate(patientPolicyId, selectedProcedures);
      setEstimate(res.data.data);
    } catch (err) {
      alert('Failed to calculate estimate. Ensure policy is active.');
    } finally {
      setLoading(false);
    }
  };

  const submitInvoice = async () => {
    if (!window.confirm('Create official invoice?')) return;
    setLoading(true);
    try {
      const res = await insuranceApi.createInsuredInvoice(patientPolicyId, patientId, selectedProcedures);
      alert('Invoice created successfully!');
      onInvoiceCreated(res.data.invoice_id);
    } catch (err) {
      alert('Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Create Insured Invoice</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Add Treatments</h3>
        <select 
          className="border p-2 rounded w-full mb-4"
          onChange={(e) => handleAddProcedure(Number(e.target.value))}
          defaultValue=""
        >
          <option value="" disabled>Select Procedure...</option>
          {availableProcedures.map(p => (
            <option key={p.id} value={p.id}>{p.name} - UGX {p.price.toLocaleString()}</option>
          ))}
        </select>

        <ul>
          {selectedProcedures.map((sp, idx) => {
            const proc = availableProcedures.find(p => p.id === sp.procedure_id);
            return <li key={idx} className="bg-gray-50 p-2 border-b">{proc?.name} (Qty: {sp.quantity})</li>;
          })}
        </ul>
      </div>

      <button 
        onClick={getEstimate}
        disabled={selectedProcedures.length === 0 || loading}
        className="bg-gray-800 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
      >
        Calculate Coverage Estimate
      </button>

      {estimate && (
        <div className="border-t pt-6">
          <h3 className="font-bold text-lg mb-4 text-green-700">Billing Estimate</h3>
          
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Item</th>
                <th className="p-2 border text-right">Total</th>
                <th className="p-2 border text-right text-blue-600">Ins. Covers</th>
                <th className="p-2 border text-right text-red-600">Patient Co-pay</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2 border">{item.name} {item.note && <span className="text-xs text-red-500 block">{item.note}</span>}</td>
                  <td className="p-2 border text-right">UGX {item.total_amount.toLocaleString()}</td>
                  <td className="p-2 border text-right text-blue-600">UGX {item.insurance_amount.toLocaleString()}</td>
                  <td className="p-2 border text-right text-red-600">UGX {item.patient_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50">
                <td className="p-2 border text-right">TOTALS:</td>
                <td className="p-2 border text-right">UGX {estimate.total_amount.toLocaleString()}</td>
                <td className="p-2 border text-right text-blue-600">UGX {estimate.insurance_responsibility.toLocaleString()}</td>
                <td className="p-2 border text-right text-red-600">UGX {estimate.patient_responsibility.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-end">
            <button 
              onClick={submitInvoice}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 disabled:opacity-50"
            >
              Confirm & Generate Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
