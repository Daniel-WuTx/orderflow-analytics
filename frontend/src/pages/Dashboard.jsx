import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import api from '../api/axios';

export default function Dashboard() {
  const [summary,   setSummary]   = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProds,  setTopProds]  = useState([]);
  const [rfm,       setRfm]       = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, sales, top, rfmData] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/sales-by-month'),
          api.get('/analytics/top-products'),
          api.get('/analytics/rfm'),
        ]);
        setSummary(s.data);
        setSalesData(sales.data);
        setTopProds(top.data);
        setRfm(rfmData.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <p style={{ padding:'2rem' }}>Cargando analytics...</p>;

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Dashboard</h2>

      {/* Métricas resumen */}
      <div style={styles.metricGrid}>
        {[
          { label: 'Clientes',        value: summary.total_customers },
          { label: 'Órdenes',         value: summary.total_orders },
          { label: 'Ingresos',        value: `$${Number(summary.total_revenue).toFixed(2)}` },
          { label: 'Productos activos', value: summary.active_products },
        ].map(m => (
          <div key={m.label} style={styles.metricCard}>
            <p style={styles.metricVal}>{m.value}</p>
            <p style={styles.metricLabel}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Ventas por mes */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Ventas por mes</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize:12 }} />
            <YAxis tick={{ fontSize:12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue"      stroke="#4F46E5" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="total_orders" stroke="#10B981" strokeWidth={2} name="Órdenes" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top productos */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Top 5 productos</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topProds} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize:12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize:12 }} width={130} />
            <Tooltip />
            <Bar dataKey="units_sold" fill="#4F46E5" name="Unidades vendidas" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segmentación RFM */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Segmentación de clientes (RFM)</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Cliente','Órdenes','Total gastado','Días sin comprar','Segmento'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rfm.map(c => (
              <tr key={c.id}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.frequency}</td>
                <td style={styles.td}>${c.monetary}</td>
                <td style={styles.td}>{c.days_since_last_order ?? '—'}</td>
                <td style={styles.td}>
                  <span style={{...styles.badge, ...segmentColor(c.segment)}}>
                    {c.segment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const segmentColor = (seg) => ({
  'VIP':         { background:'#EDE9FE', color:'#4C1D95' },
  'Leal':        { background:'#ECFDF5', color:'#065F46' },
  'Prometedor':  { background:'#FEF3C7', color:'#92400E' },
  'En riesgo':   { background:'#FEF2F2', color:'#991B1B' },
}[seg] || {});

const styles = {
  page:        { padding:'2rem', maxWidth:'1100px', margin:'0 auto' },
  title:       { fontSize:'22px', fontWeight:500, marginBottom:'1.5rem' },
  metricGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'12px', marginBottom:'1.5rem' },
  metricCard:  { background:'#F9FAFB', borderRadius:'12px', padding:'1.25rem', textAlign:'center' },
  metricVal:   { fontSize:'28px', fontWeight:600, color:'#4F46E5', margin:'0 0 4px' },
  metricLabel: { fontSize:'13px', color:'#6B7280', margin:0 },
  chartCard:   { background:'#fff', border:'1px solid #f0f0f0', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' },
  chartTitle:  { fontSize:'16px', fontWeight:500, marginBottom:'1rem', margin:'0 0 1rem' },
  table:       { width:'100%', borderCollapse:'collapse' },
  th:          { textAlign:'left', fontSize:'13px', color:'#6B7280', padding:'8px 12px', borderBottom:'1px solid #f0f0f0' },
  td:          { padding:'10px 12px', fontSize:'14px', borderBottom:'1px solid #f9f9f9' },
  badge:       { padding:'3px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:500 },
};