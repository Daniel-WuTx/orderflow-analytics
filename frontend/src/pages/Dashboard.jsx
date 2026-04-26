// frontend/src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import api from '../api/axios';

const COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

const fmt     = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits:2 });
const fmtShort= (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`;

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

// ── Componentes reutilizables ─────────────────────────────────
const MetricCard = ({ label, value, sub, color, icon, trend }) => (
  <div style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.1rem 1.25rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'#6B7280' }}>{label}</span>
      <span style={{ fontSize:18 }}>{icon}</span>
    </div>
    <div style={{ fontSize:26, fontWeight:700, color:'#111827', lineHeight:1 }}>{value}</div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
      {sub  && <span style={{ fontSize:12, color:'#9CA3AF' }}>{sub}</span>}
      {trend && (
        <span style={{ fontSize:12, fontWeight:600, color: trend > 0 ? '#059669' : '#DC2626' }}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ height:3, borderRadius:2, background: color, marginTop:10, opacity:0.3 }}/>
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
            ? `$${fmt(p.value)}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const Panel = ({ title, sub, children, action }) => (
  <div style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
      <div>
        <p style={{ fontSize:14, fontWeight:700, color:'#111827', margin:0 }}>{title}</p>
        {sub && <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const SkeletonBlock = ({ h = 24, w = '100%', mb = 8 }) => (
  <div style={{ height:h, width:w, borderRadius:6, marginBottom:mb,
    background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)',
    backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }}/>
);

// ── Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const [summary,   setSummary]   = useState(null);
  const [sales,     setSales]     = useState([]);
  const [topProds,  setTopProds]  = useState([]);
  const [rfm,       setRfm]       = useState([]);
  const [behavior,  setBehavior]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [lastUpdate,setLastUpdate]= useState(null);
  const [refreshing,setRefreshing]= useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
      setSales(sl.data.data.map(d => ({
        ...d,
        revenue:      parseFloat(d.revenue),
        total_orders: parseInt(d.total_orders),
      })));
      setTopProds(tp.data.data.map(d => ({
        ...d,
        units_sold: parseInt(d.units_sold),
        revenue:    parseFloat(d.revenue),
      })));
      setRfm(r.data.data.map(d => ({
        ...d,
        segment: getSegment(d.r_score, d.f_score, d.m_score),
      })));
      setBehavior(cb.data.data.map(d => ({
        ...d,
        total_orders: parseInt(d.total_orders),
        total_spent:  parseFloat(d.total_spent),
      })));
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

  // ── Datos derivados ──────────────────────────────────────
  const rfmSegments  = rfm.reduce((acc, c) => { acc[c.segment] = (acc[c.segment]||0)+1; return acc; }, {});
  const rfmChart     = Object.entries(rfmSegments).map(([name, value]) => ({ name, value }));
  const topClientes  = [...rfm].sort((a,b) => b.monetary - a.monetary).slice(0, 8);

  const ticketPromedio = summary
    ? (parseFloat(summary.total_revenue) / parseInt(summary.total_orders || 1))
    : 0;

  const tasaCancelacion = sales.length
    ? ((sales.reduce((a,s) => a + s.total_orders, 0) - rfm.length) / Math.max(sales.reduce((a,s) => a + s.total_orders, 0), 1) * 100)
    : 0;

  // Datos de órdenes vs ingresos combinados
  const salesDual = sales.map(s => ({
    month:  s.month,
    Ingresos: s.revenue,
    Órdenes:  s.total_orders,
  }));

  // Distribución de gasto de clientes (buckets)
  const spendBuckets = behavior.reduce((acc, c) => {
    const spent = c.total_spent;
    const key   = spent < 500   ? '<$500'
                : spent < 2000  ? '$500-2k'
                : spent < 5000  ? '$2k-5k'
                : '>$5k';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const spendChart = ['<$500','$500-2k','$2k-5k','>$5k']
    .map(k => ({ name: k, value: spendBuckets[k] || 0 }));

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'1.25rem 2rem' }}>
        <SkeletonBlock h={20} w={200}/>
      </div>
      <div style={{ padding:'1.5rem 2rem', maxWidth:1400, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:20 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.1rem', height:110 }}><SkeletonBlock/><SkeletonBlock w="60%"/></div>)}
        </div>
        <SkeletonBlock h={280}/>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
      <p style={{ color:'#DC2626', fontSize:15 }}>{error}</p>
      <button onClick={() => fetchAll()} style={{ padding:'8px 18px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', cursor:'pointer', fontSize:14 }}>
        Reintentar
      </button>
    </div>
  );

  return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>Panel de analytics</h1>
          <p style={{ fontSize:13, color:'#6B7280', margin:'2px 0 0' }}>
            {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-CO')}` : '—'}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{ background:'#F3F4F6', border:'1px solid #E5E7EB', color:'#374151', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}
          >
            {refreshing ? '↻ Actualizando...' : '↻ Actualizar'}
          </button>
          <span style={{ background:'#ECFDF5', color:'#065F46', fontSize:12, padding:'4px 12px', borderRadius:20, fontWeight:500 }}>
            ● En vivo
          </span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'0 2rem', display:'flex', gap:4 }}>
        {[
          { key:'overview',  label:'Resumen'    },
          { key:'ventas',    label:'Ventas'      },
          { key:'productos', label:'Productos'   },
          { key:'clientes',  label:'Clientes'    },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding:'12px 16px', border:'none', background:'none',
              color: activeTab === tab.key ? '#4F46E5' : '#6B7280',
              fontSize:14, cursor:'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #4F46E5' : '2px solid transparent',
              fontWeight: activeTab === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'1.5rem 2rem', maxWidth:1400, margin:'0 auto' }}>

        {/* ══ TAB: RESUMEN ══════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* 6 métricas */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:20 }}>
              <MetricCard icon="💰" label="Ingresos totales"
                value={`$${fmt(summary.total_revenue)}`}
                sub="Excluyendo canceladas" color="#4F46E5"/>
              <MetricCard icon="🛒" label="Órdenes totales"
                value={Number(summary.total_orders).toLocaleString()}
                sub="Todas las órdenes" color="#10B981"/>
              <MetricCard icon="👥" label="Clientes"
                value={Number(summary.total_customers).toLocaleString()}
                sub="Cuentas registradas" color="#F59E0B"/>
              <MetricCard icon="📦" label="Productos activos"
                value={Number(summary.active_products).toLocaleString()}
                sub="Con stock disponible" color="#EF4444"/>
              <MetricCard icon="🎯" label="Ticket promedio"
                value={`$${fmt(ticketPromedio)}`}
                sub="Por orden" color="#8B5CF6"/>
              <MetricCard icon="👑" label="Clientes VIP"
                value={rfmSegments['VIP'] || 0}
                sub={`de ${rfm.length} analizados`} color="#EC4899"/>
            </div>

            {/* Ventas + RFM pie */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>
              <Panel title="Ingresos por mes" sub="Evolución de ventas">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={sales}>
                    <defs>
                      <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gr1)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Segmentos RFM" sub="Distribución de clientes">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={rfmChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                      {rfmChart.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            {/* Top productos + Clientes destacados */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Panel title="Top 5 productos" sub="Por ingresos">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {topProds.slice(0,5).map((p, i) => (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color: i < 3 ? COLORS[i] : '#9CA3AF', width:20, textAlign:'center' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
                      </span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, color:'#374151', margin:0, fontWeight:500 }}>{p.name}</p>
                        <div style={{ height:5, background:'#F3F4F6', borderRadius:3, marginTop:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', background:COLORS[i % COLORS.length], borderRadius:3,
                            width:`${(p.revenue / topProds[0].revenue) * 100}%`, transition:'width 0.8s' }}/>
                        </div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#4F46E5', whiteSpace:'nowrap' }}>
                        ${fmtShort(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Clientes destacados" sub="Por gasto total (RFM)">
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Cliente','Gastado','Órdenes','Seg.'].map(h => (
                        <th key={h} style={{ fontSize:11, color:'#9CA3AF', textAlign:'left', padding:'0 8px 8px', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.slice(0,6).map((c, i) => (
                      <tr key={c.user_id || i}>
                        <td style={{ fontSize:13, color:'#374151', padding:'6px 8px', borderTop:'1px solid #F9FAFB', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</td>
                        <td style={{ fontSize:13, color:'#111827', padding:'6px 8px', borderTop:'1px solid #F9FAFB', fontWeight:600 }}>${fmt(c.monetary)}</td>
                        <td style={{ fontSize:13, color:'#374151', padding:'6px 8px', borderTop:'1px solid #F9FAFB' }}>{c.frequency}</td>
                        <td style={{ padding:'6px 8px', borderTop:'1px solid #F9FAFB' }}>
                          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, fontWeight:600, ...(SEG_STYLE[c.segment]||{}) }}>{c.segment}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          </>
        )}

        {/* ══ TAB: VENTAS ═══════════════════════════════ */}
        {activeTab === 'ventas' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Doble eje: Ingresos + Órdenes */}
            <Panel title="Ingresos vs Órdenes por mes" sub="Comparativa mensual">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesDual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="left"  tick={{ fontSize:11, fill:'#4F46E5' }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:'#10B981' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/>
                  <Line yAxisId="left"  type="monotone" dataKey="Ingresos" stroke="#4F46E5" strokeWidth={2.5} dot={false} activeDot={{ r:5 }}/>
                  <Line yAxisId="right" type="monotone" dataKey="Órdenes"  stroke="#10B981" strokeWidth={2}   dot={false} activeDot={{ r:5 }}/>
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            {/* Barras de órdenes */}
            <Panel title="Volumen de órdenes por mes" sub="Cantidad de órdenes procesadas">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sales} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <Tooltip/>
                  <Bar dataKey="total_orders" name="Órdenes" radius={[6,6,0,0]}>
                    {sales.map((_, i) => <Cell key={i} fill={`${COLORS[0]}${Math.round((0.4 + (i / sales.length) * 0.6) * 255).toString(16).padStart(2,'0')}`}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        )}

        {/* ══ TAB: PRODUCTOS ════════════════════════════ */}
        {activeTab === 'productos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <Panel title="Top 10 productos por ingresos" sub="Órdenes con status delivered">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProds} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:'#6B7280' }} axisLine={false} tickLine={false} width={140}/>
                  <Tooltip formatter={v => [`$${fmt(v)}`, 'Ingresos']}/>
                  <Bar dataKey="revenue" name="Ingresos" radius={[0,8,8,0]}>
                    {topProds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Top 10 productos por unidades vendidas" sub="Cantidad total de unidades">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...topProds].sort((a,b) => b.units_sold - a.units_sold)} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:'#6B7280' }} axisLine={false} tickLine={false} width={140}/>
                  <Tooltip/>
                  <Bar dataKey="units_sold" name="Unidades" radius={[0,8,8,0]}>
                    {topProds.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        )}

        {/* ══ TAB: CLIENTES ═════════════════════════════ */}
        {activeTab === 'clientes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

              {/* Pie RFM */}
              <Panel title="Segmentos RFM" sub="Distribución por valor del cliente">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={rfmChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {rfmChart.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n) => [`${v} clientes`, n]}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                  {rfmChart.map((seg, i) => (
                    <div key={seg.name} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#F9FAFB', borderRadius:8 }}>
                      <span style={{ fontSize:12, color:'#374151' }}>{seg.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:COLORS[i] }}>{seg.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Distribución de gasto */}
              <Panel title="Distribución de gasto" sub="Clientes por rango de gasto total">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={spendChart} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize:12, fill:'#6B7280' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={v => [`${v} clientes`, 'Cantidad']}/>
                    <Bar dataKey="value" name="Clientes" radius={[8,8,0,0]}>
                      {spendChart.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            {/* Tabla top clientes */}
            <Panel title="Top clientes por gasto" sub="Ordenados por monetary score RFM">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#F9FAFB' }}>
                      {['#','Cliente','Email','Gastado','Órdenes','Recencia','Segmento'].map(h => (
                        <th key={h} style={{ fontSize:11, color:'#6B7280', textAlign:'left', padding:'8px 12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.map((c, i) => (
                      <tr key={c.user_id || i} style={{ borderTop:'1px solid #F3F4F6' }}>
                        <td style={{ padding:'9px 12px', fontSize:13, color:'#9CA3AF', fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:'9px 12px', fontSize:13, color:'#111827', fontWeight:500, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</td>
                        <td style={{ padding:'9px 12px', fontSize:12, color:'#6B7280', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.email}</td>
                        <td style={{ padding:'9px 12px', fontSize:13, fontWeight:700, color:'#4F46E5' }}>${fmt(c.monetary)}</td>
                        <td style={{ padding:'9px 12px', fontSize:13, color:'#374151' }}>{c.frequency}</td>
                        <td style={{ padding:'9px 12px', fontSize:13, color:'#6B7280' }}>{c.recency_days}d</td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, fontWeight:600, ...(SEG_STYLE[c.segment]||{}) }}>{c.segment}</span>
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
      `}</style>
    </div>
  );
}