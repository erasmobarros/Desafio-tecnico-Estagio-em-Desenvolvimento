import { useState } from 'react';
import axios from 'axios';

// Variável de ambiente com fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type BankResult = {
  bankName: string;
  status: 'APPROVED' | 'REJECTED' | 'UNAVAILABLE';
  interestRate?: number;
  installmentValue?: number;
  totalAmount?: number;
  reason?: string;
};

export function App() {
  const [formData, setFormData] = useState({
    name: '', email: '', cpf: '', salary: '', employerCnpj: '', requestedAmount: '', installments: ''
  });

  const [results, setResults] = useState<BankResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResults([]); setErrorMessage(null);

    try {
      const response = await axios.post(`${API_URL}/simulations`, {
        ...formData,
        salary: Number(formData.salary),
        requestedAmount: Number(formData.requestedAmount),
        installments: Number(formData.installments),
      });
      setResults(response.data);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data?.message || 'Dados inválidos.');
      } else {
        setErrorMessage('Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const bestOfferValue = Math.min(
    ...results.filter(b => b.status === 'APPROVED' && b.installmentValue).map(b => b.installmentValue as number)
  );

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h2>Simulador Consignado</h2>
      
      {errorMessage && (
        <div style={{ padding: '12px', background: '#ffe6e6', color: '#c00', marginBottom: '16px', borderRadius: '4px' }}>
          <strong>Atenção:</strong> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label htmlFor="name">Nome Completo: </label>
          <input id="name" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div>
          <label htmlFor="email">E-mail: </label>
          <input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div>
          <label htmlFor="cpf">CPF: </label>
          <input id="cpf" type="text" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div>
          <label htmlFor="salary">Salário (R$): </label>
          <input id="salary" type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div>
          <label htmlFor="cnpj">CNPJ do Empregador: </label>
          <input id="cnpj" type="text" value={formData.employerCnpj} onChange={e => setFormData({ ...formData, employerCnpj: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div>
          <label htmlFor="amount">Valor Desejado (R$): </label>
          <input id="amount" type="number" value={formData.requestedAmount} onChange={e => setFormData({ ...formData, requestedAmount: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div>
          <label htmlFor="installments">Número de Parcelas: </label>
          <input id="installments" type="number" value={formData.installments} onChange={e => setFormData({ ...formData, installments: e.target.value })} style={{ width: '100%', padding: '8px' }} required />
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', marginTop: '8px' }}>
          {loading ? 'Simulando...' : 'Simular'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Resultados:</h3>
          {results.map((bank, index) => {
            const isBestOffer = bank.installmentValue === bestOfferValue;
            
            return (
              <div key={index} style={{
                border: isBestOffer ? '2px solid #28a745' : '1px solid #ccc',
                opacity: bank.status === 'UNAVAILABLE' ? 0.6 : 1,
                padding: '16px', marginBottom: '12px', borderRadius: '8px',
                background: bank.status === 'APPROVED' ? '#e6fffa' : bank.status === 'REJECTED' ? '#fff5f5' : '#f0f0f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>{bank.bankName}</h4>
                  {isBestOffer && <span style={{ background: '#28a745', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Melhor Oferta</span>}
                </div>
                
                <p style={{ margin: '8px 0' }}><strong>Status:</strong> {bank.status}</p>
                
                {bank.status === 'APPROVED' && bank.installmentValue && bank.totalAmount && bank.interestRate && (
                  <>
                    <p style={{ margin: '4px 0' }}>Taxa: {(bank.interestRate * 100).toFixed(2)}% a.m.</p>
                    <p style={{ margin: '4px 0' }}>Parcela: {formatCurrency(bank.installmentValue)}</p>
                    <p style={{ margin: '4px 0' }}>Total a Pagar: {formatCurrency(bank.totalAmount)}</p>
                  </>
                )}
                {bank.reason && <p style={{ margin: '4px 0', color: '#666' }}>Motivo: {bank.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;