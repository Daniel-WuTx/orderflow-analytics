// frontend/src/pages/Orders.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_META = {
  pending:    { label:'Pendiente',  color:'#F59E0B', bg:'#FEF3C7', icon:'🕐' },
  processing: { label:'Procesando', color:'#8B5CF6', bg:'#EDE9FE', icon:'⚙️'  },
  shipped:    { label:'Enviado',    color:'#0EA5E9', bg:'#E0F2FE', icon:'🚚' },
  delivered:  { label:'Entregado',  color:'#10B981', bg:'#ECFDF5', icon:'✅' },
  cancelled:  { label:'Cancelado',  color:'#EF4444', bg:'#FEF2F2', icon:'❌' },
};

const PAYMENT_META = {
  approved: { label:'Pagado',    color:'#065F46', bg:'#ECFDF5' },
  pending:  { label:'Pendiente', color:'#92400E', bg:'#FEF3C7' },
  declined: { label:'Rechazado', color:'#991B1B', bg:'#FEF2F2' },
};

const fmt = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits:2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

// ── Timeline ──────────────────────────────────────────────────
const OrderTimeline = ({ status }) => {
  const isCancelled = status === 'cancelled';
  const currentIdx  = STEPS.indexOf(status);

  if (isCancelled) return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', background:'#FEF2F2', borderRadius:10, marginBottom:16 }}>
      <span style={{ fontSize:20 }}>❌</span>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'#991B1B', margin:0 }}>Orden cancelada</p>
        <p style={{ fontSize:12, color:'#B91C1C', margin:0 }}>Esta orden fue cancelada y no será procesada.</p>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
        {/* Línea de fondo */}
        <div style={{ position:'absolute', top:16, left:'10%', right:'10%', height:3, background:'#F3F4F6', borderRadius:2, zIndex:0 }}/>
        {/* Línea de progreso */}
        <div style={{
          position:'absolute', top:16, left:'10%', height:3,
          background:'linear-gradient(90deg, #4F46E5, #818CF8)',
          borderRadius:2, zIndex:1,
          width: currentIdx === 0 ? '0%' : `${(currentIdx / (STEPS.length - 1)) * 80}%`,
          transition:'width 0.6s ease',
        }}/>

        {STEPS.map((step, i) => {
          const done    = i <= currentIdx;
          const active  = i === currentIdx;
          const meta    = STATUS_META[step];
          return (
            <div key={step} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, zIndex:2, flex:1 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background: done ? '#4F46E5' : '#F3F4F6',
                border: active ? '3px solid #818CF8' : done ? '3px solid #4F46E5' : '3px solid #E5E7EB',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14,
                boxShadow: active ? '0 0 0 4px rgba(79,70,229,0.15)' : 'none',
                transition:'all 0.3s',
              }}>
                {done ? <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span> : <span style={{ fontSize:12 }}>{meta.icon}</span>}
              </div>
              <span style={{ fontSize:11, fontWeight: active ? 700 : 400, color: active ? '#4F46E5' : done ? '#374151' : '#9CA3AF', textAlign:'center' }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Orders() {
  const navigate                          = useNavigate();
  const [searchParams]                    = useSearchParams();
  const { addItem }                       = useCart();
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [paying,        setPaying]        = useState(null);
  const [expanded,      setExpanded]      = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [reordering,    setReordering]    = useState(null);

  const redirectOrderId = searchParams.get('order_id') || searchParams.get('id');

  const fetchPaymentStatus = useCallback(async (orderId) => {
    try {
      const { data } = await api.get(`/payments/order/${orderId}`);
      setPaymentStatus(prev => ({ ...prev, [orderId]: data }));
    } catch { /* sin pagos aún */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my');
      const list = Array.isArray(data) ? data : (data.orders || []);
      setOrders(list);
      if (redirectOrderId) {
        setExpanded(redirectOrderId);
        fetchPaymentStatus(redirectOrderId);
      }
    } finally {
      setLoading(false);
    }
  }, [redirectOrderId, fetchPaymentStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleToggle = (orderId) => {
    const next = expanded === orderId ? null : orderId;
    setExpanded(next);
    if (next && !paymentStatus[next]) fetchPaymentStatus(next);
  };

  const handlePay = async (order) => {
    setPaying(order.id);
    try {
      const { data } = await api.post('/payments', {
        order_id:        order.id,
        idempotency_key: crypto.randomUUID(),
        currency:        'COP',
      });
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else {
        await fetchOrders();
        setPaymentStatus(prev => ({ ...prev, [order.id]: { status: data.status } }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar el pago');
    } finally {
      setPaying(null);
    }
  };

  const handleReorder = async (order) => {
    setReordering(order.id);
    try {
      for (const item of order.items) {
        await addItem(item.productId, item.quantity);
      }
      navigate('/cart');
    } catch {
      alert('Error al volver a pedir. Algunos productos pueden no tener stock.');
    } finally {
      setReordering(null);
    }
  };

  // Stats rápidas
  const stats = {
    total:     orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending:   orders.filter(o => ['pending','processing','shipped'].includes(o.status)).length,
    spent:     orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>Mis órdenes</h1>
          <p style={{ fontSize:13, color:'#6B7280', margin:'2px 0 0' }}>{orders.length} órdenes en total</p>
        </div>
        <button onClick={() => navigate('/products')} style={styles.btnSecondary}>
          + Seguir comprando
        </button>
      </div>

      <div style={{ padding:'1.5rem 2rem', maxWidth:900, margin:'0 auto' }}>

        {/* Banner regreso de Wompi */}
        {redirectOrderId && (
          <div style={styles.returnBanner}>
            <span style={{ fontSize:16 }}>ℹ️</span>
            <span style={{ fontSize:14, color:'#1E40AF' }}>
              Regresaste del proceso de pago. El estado de tu orden está actualizado abajo.
            </span>
          </div>
        )}

        {/* Stats */}
        {!loading && orders.length > 0 && (
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <span style={styles.statVal}>{stats.total}</span>
              <span style={styles.statLbl}>Total órdenes</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statVal}>{stats.delivered}</span>
              <span style={styles.statLbl}>Entregadas</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statVal}>{stats.pending}</span>
              <span style={styles.statLbl}>En proceso</span>
            </div>
            <div style={styles.statCard}>
              <span style={{ ...styles.statVal, color:'#4F46E5' }}>${fmt(stats.spent)}</span>
              <span style={styles.statLbl}>Total gastado</span>
            </div>
          </div>
        )}

        {/* Filtros */}
        {!loading && orders.length > 0 && (
          <div style={styles.filterTabs}>
            {[
              { key:'all',        label:'Todas'      },
              { key:'pending',    label:'Pendientes' },
              { key:'processing', label:'Procesando' },
              { key:'shipped',    label:'Enviadas'   },
              { key:'delivered',  label:'Entregadas' },
              { key:'cancelled',  label:'Canceladas' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{ ...styles.filterTab, ...(filter === tab.key ? styles.filterTabActive : {}) }}
              >
                {tab.label}
                <span style={styles.filterCount}>
                  {tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.25rem', height:80, animation:'shimmer 1.4s infinite',
                backgroundImage:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'400px 100%' }}/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>📦</div>
            <p style={{ fontSize:15, color:'#6B7280', marginBottom:16 }}>
              {filter === 'all' ? 'No tienes órdenes aún' : `No tienes órdenes ${STATUS_META[filter]?.label.toLowerCase() || ''}`}
            </p>
            {filter !== 'all'
              ? <button onClick={() => setFilter('all')} style={styles.btnSecondary}>Ver todas</button>
              : <button onClick={() => navigate('/products')} style={styles.btnPrimary}>Ver productos</button>
            }
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(order => {
              const st      = STATUS_META[order.status] || STATUS_META.pending;
              const payment = paymentStatus[order.id];
              const pst     = payment ? (PAYMENT_META[payment.status] || PAYMENT_META.pending) : null;
              const isOpen  = expanded === order.id;
              const canPay  = order.status === 'pending' && (!payment || payment.status === 'declined');

              return (
                <div key={order.id} style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, overflow:'hidden', transition:'box-shadow 0.2s' }}>

                  {/* Fila principal */}
                  <div style={styles.orderRow} onClick={() => handleToggle(order.id)}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>
                          #{order.id?.slice(0,8).toUpperCase()}
                        </span>
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600, background:st.bg, color:st.color }}>
                          {st.icon} {st.label}
                        </span>
                        {pst && (
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:500, background:pst.bg, color:pst.color }}>
                            {pst.label}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>
                        {fmtDate(order.createdAt)} · {order.items?.length || 0} producto(s)
                      </p>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                      <span style={{ fontSize:16, fontWeight:700, color:'#4F46E5' }}>
                        ${fmt(order.total)}
                      </span>
                      {canPay && (
                        <button
                          onClick={e => { e.stopPropagation(); handlePay(order); }}
                          disabled={paying === order.id}
                          style={styles.btnPay}
                        >
                          {paying === order.id ? '...' : '💳 Pagar'}
                        </button>
                      )}
                      <span style={{ color:'#D1D5DB', fontSize:14, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', userSelect:'none' }}>▾</span>
                    </div>
                  </div>

                  {/* Detalle expandible */}
                  {isOpen && (
                    <div style={styles.detailBox}>

                      {/* Timeline */}
                      <OrderTimeline status={order.status}/>

                      {/* Items */}
                      <p style={styles.sectionLabel}>Productos</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={styles.itemRow}>
                            <div style={styles.itemAvatar}>
                              {(item.name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:13, fontWeight:500, color:'#374151', margin:0 }}>
                                {item.name || item.productId?.slice(0,8)}
                              </p>
                              <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>
                                ${fmt(item.unitPrice)} × {item.quantity}
                              </p>
                            </div>
                            <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>
                              ${fmt(item.subtotal)}
                            </span>
                          </div>
                        ))}

                        {/* Total */}
                        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid #F3F4F6', marginTop:4 }}>
                          <span style={{ fontSize:14, fontWeight:600, color:'#374151' }}>Total</span>
                          <span style={{ fontSize:16, fontWeight:700, color:'#4F46E5' }}>${fmt(order.total)}</span>
                        </div>
                      </div>

                      {/* Info de pago */}
                      {payment && (
                        <div style={styles.paymentBox}>
                          <p style={styles.sectionLabel}>Información de pago</p>
                          <div style={{ display:'flex', gap:20, fontSize:13, flexWrap:'wrap' }}>
                            <span style={{ color:'#6B7280' }}>
                              Estado: <strong style={{ color:pst?.color }}>{pst?.label}</strong>
                            </span>
                            {payment.provider && (
                              <span style={{ color:'#6B7280' }}>
                                Proveedor: <strong style={{ color:'#374151', textTransform:'capitalize' }}>{payment.provider}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CTA pagar */}
                      {canPay && !payment && (
                        <div style={styles.payBanner}>
                          <p style={{ fontSize:13, color:'#92400E', margin:'0 0 10px', fontWeight:500 }}>
                            ⏳ Esta orden está esperando pago
                          </p>
                          <button
                            onClick={() => handlePay(order)}
                            disabled={paying === order.id}
                            style={{ ...styles.btnPrimary, width:'100%', padding:'10px' }}
                          >
                            {paying === order.id ? 'Procesando...' : '💳 Pagar ahora con Wompi'}
                          </button>
                        </div>
                      )}

                      {/* Botón reordenar */}
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleReorder(order)}
                          disabled={reordering === order.id}
                          style={{ ...styles.btnSecondary, width:'100%', marginTop:8, padding:'9px', fontSize:13 }}
                        >
                          {reordering === order.id ? 'Agregando al carrito...' : '🔄 Volver a pedir'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

const styles = {
  header:       { background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'1.25rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  statsRow:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 },
  statCard:     { background:'#fff', border:'1px solid #F0F0F0', borderRadius:10, padding:'0.85rem 1rem', display:'flex', flexDirection:'column', gap:4, alignItems:'center' },
  statVal:      { fontSize:20, fontWeight:700, color:'#111827' },
  statLbl:      { fontSize:11, color:'#9CA3AF', textAlign:'center' },
  filterTabs:   { display:'flex', gap:4, marginBottom:14, flexWrap:'wrap' },
  filterTab:    { display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', color:'#6B7280', fontSize:13, cursor:'pointer' },
  filterTabActive: { background:'#EDE9FE', border:'1px solid #C4B5FD', color:'#4F46E5', fontWeight:600 },
  filterCount:  { background:'#F3F4F6', color:'#6B7280', fontSize:11, padding:'1px 6px', borderRadius:10, fontWeight:600 },
  orderRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 1.25rem', cursor:'pointer' },
  detailBox:    { borderTop:'1px solid #F3F4F6', padding:'1.25rem', background:'#FAFAFA' },
  sectionLabel: { fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 10px' },
  itemRow:      { display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#fff', borderRadius:8, border:'1px solid #F3F4F6' },
  itemAvatar:   { width:32, height:32, borderRadius:8, background:'#EDE9FE', color:'#4C1D95', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  paymentBox:   { marginTop:12, paddingTop:12, borderTop:'1px solid #F3F4F6' },
  payBanner:    { marginTop:12, padding:'1rem', background:'#FEF3C7', borderRadius:10, textAlign:'center' },
  returnBanner: { display:'flex', alignItems:'center', gap:10, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'12px 16px', marginBottom:16 },
  emptyBox:     { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'3rem', textAlign:'center' },
  btnPrimary:   { padding:'9px 18px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:14, cursor:'pointer', fontWeight:500 },
  btnSecondary: { padding:'8px 16px', borderRadius:8, background:'#fff', color:'#374151', border:'1px solid #E5E7EB', fontSize:13, cursor:'pointer' },
  btnPay:       { padding:'6px 14px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontWeight:600 },
};