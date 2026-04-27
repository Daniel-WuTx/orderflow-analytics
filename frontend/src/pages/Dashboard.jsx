// frontend/src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import api from '../api/axios';

const COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

const fmt      = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits:2 });
const fmtShort = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`;

const getSegment = (r, f, m) => {
  const t = r + f + m;
  if (t >= 10) return 'VIP';
  if (t >= 7)  return 'Leal';
  if (t >= 5)  return 'Prometedor';
  return 'En riesgo';
};

const SEG_STYLE = {
  VIP:         { background:'#EDE9FE', color:'#4C1D95' },
  Leal:        { background:'#ECFDF5', color:'#065F46' },
  Prometedor:  { background:'#FEF3C7', color:'#92400E' },
  'En riesgo': { background:'#FEF2F2', color:'#991B1B' },
};

const MetricCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'#6B7280' }}>{label}</span>
      <span style={{ fontSize:18 }}>{icon}</span>
    </div>
    <div style={{ fontSize:22, fontWeight:700, color:'#111827', lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>{sub}</div>}
    <div style={{ height:3, borderRadius:2, background:color, marginTop:10, opacity:0.3 }}/>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'10px 14px', fontSize:13, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ color:'#6B7280', marginBottom:6, fontWeight:500 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:p.color, fontWeight:600, margin:'3px 0' }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('ingreso')
            ? `$${fmt(p.value)}` : p.value}
        </p>
      ))}
    </div>
  );
};

const Panel = ({ title, sub, children }) => (
  <div style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1rem', minWidth:0 }}>
    <p style={{ fontSize:14, fontWeight:700, color:'#111827', margin:'0 0 2px' }}>{title}</p>
    {sub && <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 1rem' }}>{sub}</p>}
    {children}
  </div>
);

const SkeletonBlock = ({ h = 24, w = '100%' }) => (
  <div style={{ height:h, width:w, borderRadius:6, marginBottom:8,
    background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)',
    backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }}/>
);

export default function Dashboard() {
  const [summary,    setSummary]    = useState(null);
  const [sales,      setSales]      = useState([]);
  const [topProds,   setTopProds]   = useState([]);
  const [rfm,        setRfm]        = useState([]);
  const [behavior,   setBehavior]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('overview');

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [s, sl, tp, r, cb] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/sales-by-month'),
        api.get('/analytics/top-products?limit=10'),
        api.get('/analytics/rfm'),
        api.get('/analytics/customer-behavior?limit=50'),
      ]);
      setSummary(s.data.data);
      setSales(sl.data.data.map(d => ({ ...d, revenue: parseFloat(d.revenue), total_orders: parseInt(d.total_orders) })));
      setTopProds(tp.data.data.map(d => ({ ...d, units_sold: parseInt(d.units_sold), revenue: parseFloat(d.revenue) })));
      setRfm(r.data.data.map(d => ({ ...d, segment: getSegment(d.r_score, d.f_score, d.m_score) })));
      setBehavior(cb.data.data.map(d => ({ ...d, total_orders: parseInt(d.total_orders), total_spent: parseFloat(d.total_spent) })));
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const rfmSegments    = rfm.reduce((acc, c) => { acc[c.segment] = (acc[c.segment]||0)+1; return acc; }, {});
  const rfmChart       = Object.entries(rfmSegments).map(([name, value]) => ({ name, value }));
  const topClientes    = [...rfm].sort((a,b) => b.monetary - a.monetary).slice(0, 8);
  const ticketPromedio = summary ? (parseFloat(summary.total_revenue) / parseInt(summary.total_orders || 1)) : 0;
  const salesDual      = sales.map(s => ({ month: s.month, Ingresos: s.revenue, Órdenes: s.total_orders }));
  const spendBuckets   = behavior.reduce((acc, c) => {
    const key = c.total_spent < 500 ? '<$500' : c.total_spent < 2000 ? '$500-2k' : c.total_spent < 5000 ? '$2k-5k' : '>$5k';
    acc[key] = (acc[key]||0)+1; return acc;
  }, {});
  const spendChart = ['<$500','$500-2k','$2k-5k','>$5k'].map(k => ({ name:k, value: spendBuckets[k]||0 }));

  if (loading) return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'1rem 1.25rem' }}>
        <SkeletonBlock h={20} w={200}/>
      </div>
      <div style={{ padding:'1rem' }}>
        <div className="dash-metrics" style={{ marginBottom:14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ background:'#fff', borderRadius:12, padding:'1rem', height:100, border:'1px solid #F0F0F0' }}><SkeletonBlock/><SkeletonBlock w="60%"/></div>)}
        </div>
        <SkeletonBlock h={250}/>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} .dash-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px} @media(max-width:640px){.dash-metrics{grid-template-columns:repeat(2,1fr)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
      <p style={{ color:'#DC2626', fontSize:15 }}>{error}</p>
      <button onClick={() => fetchAll()} style={{ padding:'8px 18px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', cursor:'pointer' }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh', overflowX:'hidden' }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Panel de analytics</h1>
          <p style={{ fontSize:12, color:'#6B7280', margin:'2px 0 0' }}>
            {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-CO')}` : '—'}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            style={{ background:'#F3F4F6', border:'1px solid #E5E7EB', color:'#374151', padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            {refreshing ? '↻ ...' : '↻ Actualizar'}
          </button>
          <span style={{ background:'#ECFDF5', color:'#065F46', fontSize:11, padding:'4px 10px', borderRadius:20, fontWeight:500 }}>● En vivo</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'0 1rem', display:'flex', gap:2, overflowX:'auto' }}>
        {[{key:'overview',label:'Resumen'},{key:'ventas',label:'Ventas'},{key:'productos',label:'Productos'},{key:'clientes',label:'Clientes'}].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding:'12px 14px', border:'none', background:'none', whiteSpace:'nowrap',
            color: activeTab === tab.key ? '#4F46E5' : '#6B7280', fontSize:13, cursor:'pointer',
            borderBottom: activeTab === tab.key ? '2px solid #4F46E5' : '2px solid transparent',
            fontWeight: activeTab === tab.key ? 600 : 400,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ padding:'1rem', maxWidth:1200, margin:'0 auto', boxSizing:'border-box' }}>

        {/* ══ RESUMEN ══ */}
        {activeTab === 'overview' && (
          <>
            <div className="dash-metrics" style={{ marginBottom:14 }}>
              <MetricCard icon="💰" label="Ingresos totales"  value={`$${fmt(summary.total_revenue)}`}               sub="Excluyendo canceladas" color="#4F46E5"/>
              <MetricCard icon="🛒" label="Órdenes totales"   value={Number(summary.total_orders).toLocaleString()}   sub="Todas las órdenes"    color="#10B981"/>
              <MetricCard icon="👥" label="Clientes"          value={Number(summary.total_customers).toLocaleString()} sub="Cuentas registradas"  color="#F59E0B"/>
              <MetricCard icon="📦" label="Productos activos" value={Number(summary.active_products).toLocaleString()} sub="Con stock"            color="#EF4444"/>
              <MetricCard icon="🎯" label="Ticket promedio"   value={`$${fmt(ticketPromedio)}`}                       sub="Por orden"            color="#8B5CF6"/>
              <MetricCard icon="👑" label="Clientes VIP"      value={rfmSegments['VIP'] || 0}                         sub={`de ${rfm.length}`}   color="#EC4899"/>
            </div>

            <div className="dash-2col" style={{ marginBottom:14 }}>
              <Panel title="Ingresos por mes" sub="Evolución de ventas">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={sales}>
                    <defs>
                      <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#4F46E5" strokeWidth={2} fill="url(#gr1)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Segmentos RFM" sub="Distribución de clientes">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={rfmChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={38} paddingAngle={3}>
                      {rfmChart.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n) => [v, n]}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <div className="dash-2col">
              <Panel title="Top 5 productos" sub="Por ingresos">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {topProds.slice(0,5).map((p,i) => (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color: i<3?COLORS[i]:'#9CA3AF', width:20, textAlign:'center', flexShrink:0 }}>
                        {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, color:'#374151', margin:0, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                        <div style={{ height:4, background:'#F3F4F6', borderRadius:3, marginTop:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', background:COLORS[i%COLORS.length], borderRadius:3, width:`${(p.revenue/topProds[0].revenue)*100}%` }}/>
                        </div>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#4F46E5', flexShrink:0 }}>{fmtShort(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Clientes destacados" sub="Por gasto total (RFM)">
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:260 }}>
                    <thead>
                      <tr>
                        {['Cliente','Gastado','Órd.','Seg.'].map(h => (
                          <th key={h} style={{ fontSize:10, color:'#9CA3AF', textAlign:'left', padding:'0 6px 8px', fontWeight:500, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topClientes.slice(0,6).map((c,i) => (
                        <tr key={c.user_id||i}>
                          <td style={{ fontSize:12, color:'#374151', padding:'5px 6px', borderTop:'1px solid #F9FAFB', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</td>
                          <td style={{ fontSize:12, color:'#111827', padding:'5px 6px', borderTop:'1px solid #F9FAFB', fontWeight:600, whiteSpace:'nowrap' }}>${fmt(c.monetary)}</td>
                          <td style={{ fontSize:12, color:'#374151', padding:'5px 6px', borderTop:'1px solid #F9FAFB' }}>{c.frequency}</td>
                          <td style={{ padding:'5px 6px', borderTop:'1px solid #F9FAFB' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:20, fontWeight:600, whiteSpace:'nowrap', ...(SEG_STYLE[c.segment]||{}) }}>{c.segment}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </>
        )}

        {/* ══ VENTAS ══ */}
        {activeTab === 'ventas' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Panel title="Ingresos vs Órdenes por mes" sub="Comparativa mensual">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesDual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="left"  tick={{ fontSize:10, fill:'#4F46E5' }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:'#10B981' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
                  <Line yAxisId="left"  type="monotone" dataKey="Ingresos" stroke="#4F46E5" strokeWidth={2} dot={false} activeDot={{ r:4 }}/>
                  <Line yAxisId="right" type="monotone" dataKey="Órdenes"  stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r:4 }}/>
                </LineChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Volumen de órdenes por mes" sub="Cantidad de órdenes procesadas">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sales} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <Tooltip/>
                  <Bar dataKey="total_orders" name="Órdenes" radius={[4,4,0,0]}>
                    {sales.map((_,i) => <Cell key={i} fill={`${COLORS[0]}${Math.round((0.4+(i/sales.length)*0.6)*255).toString(16).padStart(2,'0')}`}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        )}

        {/* ══ PRODUCTOS ══ */}
        {activeTab === 'productos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Panel title="Top 10 por ingresos" sub="Órdenes delivered">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProds} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:'#6B7280' }} axisLine={false} tickLine={false} width={110}/>
                  <Tooltip formatter={v => [`$${fmt(v)}`, 'Ingresos']}/>
                  <Bar dataKey="revenue" name="Ingresos" radius={[0,6,6,0]}>
                    {topProds.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Top 10 por unidades vendidas" sub="Cantidad total de unidades">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...topProds].sort((a,b)=>b.units_sold-a.units_sold)} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:'#6B7280' }} axisLine={false} tickLine={false} width={110}/>
                  <Tooltip/>
                  <Bar dataKey="units_sold" name="Unidades" radius={[0,6,6,0]}>
                    {topProds.map((_,i) => <Cell key={i} fill={COLORS[(i+2)%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        )}

        {/* ══ CLIENTES ══ */}
        {activeTab === 'clientes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="dash-2col">
              <Panel title="Segmentos RFM" sub="Distribución por valor del cliente">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={rfmChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                      {rfmChart.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n) => [`${v} clientes`, n]}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 }}>
                  {rfmChart.map((seg,i) => (
                    <div key={seg.name} style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', background:'#F9FAFB', borderRadius:8 }}>
                      <span style={{ fontSize:11, color:'#374151' }}>{seg.name}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:COLORS[i] }}>{seg.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Distribución de gasto" sub="Clientes por rango">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={spendChart} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize:11, fill:'#6B7280' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={v => [`${v} clientes`, 'Cantidad']}/>
                    <Bar dataKey="value" name="Clientes" radius={[6,6,0,0]}>
                      {spendChart.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
            <Panel title="Top clientes por gasto" sub="Ordenados por monetary score RFM">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:400 }}>
                  <thead>
                    <tr style={{ background:'#F9FAFB' }}>
                      {['#','Cliente','Email','Gastado','Órd.','Rec.','Seg.'].map(h => (
                        <th key={h} style={{ fontSize:10, color:'#6B7280', textAlign:'left', padding:'7px 10px', fontWeight:600, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.map((c,i) => (
                      <tr key={c.user_id||i} style={{ borderTop:'1px solid #F3F4F6' }}>
                        <td style={{ padding:'8px 10px', fontSize:12, color:'#9CA3AF', fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, color:'#111827', fontWeight:500, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:'#6B7280', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.email}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, fontWeight:700, color:'#4F46E5', whiteSpace:'nowrap' }}>${fmt(c.monetary)}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, color:'#374151' }}>{c.frequency}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, color:'#6B7280' }}>{c.recency_days}d</td>
                        <td style={{ padding:'8px 10px' }}>
                          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, fontWeight:600, ...(SEG_STYLE[c.segment]||{}) }}>{c.segment}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .dash-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .dash-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 640px) {
          .dash-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
          .dash-2col {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 380px) {
          .dash-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}