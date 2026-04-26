import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { user }                          = useAuth();
  const { items, totalPrice, updateItem,
          removeItem, clearCart, checkout } = useCart();
  const navigate                          = useNavigate();
  const [checkingOut, setCheckingOut]     = useState(false);
  const [removing,    setRemoving]        = useState(null);
  const [updating,    setUpdating]        = useState(null);
  const [orderDone,   setOrderDone]       = useState(null);

  if (!user) {
    return (
      <div style={styles.centered}>
        <p style={{ color:'#6B7280', fontSize:15, marginBottom:12 }}>
          Debes iniciar sesión para ver tu carrito.
        </p>
        <button onClick={() => navigate('/login')} style={styles.btnPrimary}>
          Iniciar sesión
        </button>
      </div>
    );
  }

  const handleQty = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdating(productId);
    try { await updateItem(productId, newQty); }
    catch (err) { alert(err.response?.data?.error || 'Error al actualizar'); }
    finally { setUpdating(null); }
  };

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try { await removeItem(productId); }
    catch { alert('Error al eliminar el producto'); }
    finally { setRemoving(null); }
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    setCheckingOut(true);
    try {
      const order = await checkout();
      setOrderDone(order);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setCheckingOut(false);
    }
  };

  // Pantalla de orden confirmada
  if (orderDone) return (
    <div style={styles.centered}>
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:'0 0 6px' }}>
          ¡Pedido confirmado!
        </h2>
        <p style={{ fontSize:14, color:'#6B7280', margin:'0 0 4px' }}>
          Orden <strong style={{ color:'#4F46E5' }}>#{orderDone.id?.slice(0,8).toUpperCase()}</strong>
        </p>
        <p style={{ fontSize:14, color:'#6B7280', margin:'0 0 20px' }}>
          Total: <strong>${Number(orderDone.total).toLocaleString('es-CO', { minimumFractionDigits:2 })}</strong>
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => navigate('/products')} style={styles.btnSecondary}>
            Seguir comprando
          </button>
          <button onClick={() => navigate('/orders')} style={styles.btnPrimary}>
            Ver mis órdenes
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>Mi carrito</h1>
          <p style={{ fontSize:13, color:'#6B7280', margin:'2px 0 0' }}>
            {items.length === 0 ? 'Vacío' : `${items.reduce((a,i) => a + i.quantity, 0)} producto(s)`}
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} style={styles.btnDanger}>
            Vaciar carrito
          </button>
        )}
      </div>

      <div style={{ padding:'1.5rem 2rem', maxWidth:900, margin:'0 auto' }}>

        {items.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>🛒</div>
            <p style={{ fontSize:15, color:'#6B7280', marginBottom:16 }}>Tu carrito está vacío</p>
            <button onClick={() => navigate('/products')} style={styles.btnPrimary}>
              Ver productos
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'start' }}>

            {/* Lista de items */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {items.map(item => (
                <div key={item.productId} style={styles.itemCard}>
                  <div style={styles.itemInfo}>
                    <div style={styles.itemAvatar}>
                      {item.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:15, fontWeight:600, color:'#111827', margin:'0 0 2px' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize:13, color:'#6B7280', margin:0 }}>
                        ${Number(item.price || item.unitPrice || 0).toLocaleString('es-CO', { minimumFractionDigits:2 })} c/u
                      </p>
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    {/* Controles de cantidad */}
                    <div style={styles.qtyControl}>
                      <button
                        onClick={() => handleQty(item.productId, item.quantity - 1)}
                        disabled={updating === item.productId || item.quantity <= 1}
                        style={styles.qtyBtn}
                      >−</button>
                      <span style={styles.qtyVal}>
                        {updating === item.productId ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleQty(item.productId, item.quantity + 1)}
                        disabled={updating === item.productId}
                        style={styles.qtyBtn}
                      >+</button>
                    </div>

                    {/* Subtotal */}
                    <span style={{ fontSize:15, fontWeight:700, color:'#4F46E5', minWidth:90, textAlign:'right' }}>
                      ${(item.quantity * parseFloat(item.price || item.unitPrice || 0))
                          .toLocaleString('es-CO', { minimumFractionDigits:2 })}
                    </span>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={removing === item.productId}
                      style={styles.removeBtn}
                    >
                      {removing === item.productId ? '...' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del pedido */}
            <div style={styles.summaryCard}>
              <p style={{ fontSize:15, fontWeight:700, color:'#111827', margin:'0 0 16px' }}>
                Resumen del pedido
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {items.map(item => (
                  <div key={item.productId} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'#6B7280' }}>{item.name} × {item.quantity}</span>
                    <span style={{ color:'#374151', fontWeight:500 }}>
                      ${(item.quantity * parseFloat(item.price || item.unitPrice || 0))
                          .toLocaleString('es-CO', { minimumFractionDigits:2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:14, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:15, fontWeight:600, color:'#111827' }}>Total</span>
                  <span style={{ fontSize:20, fontWeight:700, color:'#4F46E5' }}>
                    ${totalPrice.toLocaleString('es-CO', { minimumFractionDigits:2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut || items.length === 0}
                style={{ ...styles.btnPrimary, width:'100%', padding:'12px', fontSize:15 }}
              >
                {checkingOut ? 'Procesando...' : 'Confirmar pedido'}
              </button>

              <button
                onClick={() => navigate('/products')}
                style={{ ...styles.btnSecondary, width:'100%', padding:'10px', fontSize:13, marginTop:8 }}
              >
                ← Seguir comprando
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header:      { background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'1.25rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  centered:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:'2rem' },
  emptyBox:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'3rem', textAlign:'center' },
  successBox:  { background:'#fff', border:'1px solid #F0F0F0', borderRadius:16, padding:'2.5rem', textAlign:'center', maxWidth:400, width:'100%' },
  successIcon: { width:56, height:56, borderRadius:'50%', background:'#ECFDF5', color:'#059669', fontSize:24, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  itemCard:    { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 },
  itemInfo:    { display:'flex', alignItems:'center', gap:12, flex:1 },
  itemAvatar:  { width:40, height:40, borderRadius:10, background:'#EDE9FE', color:'#4C1D95', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  itemActions: { display:'flex', alignItems:'center', gap:16 },
  qtyControl:  { display:'flex', alignItems:'center', gap:8, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, padding:'4px 8px' },
  qtyBtn:      { background:'none', border:'none', fontSize:16, cursor:'pointer', color:'#374151', padding:'0 4px', lineHeight:1 },
  qtyVal:      { fontSize:14, fontWeight:600, color:'#111827', minWidth:20, textAlign:'center' },
  removeBtn:   { background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', fontSize:16, padding:4 },
  summaryCard: { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.25rem', position:'sticky', top:72 },
  btnPrimary:  { padding:'9px 18px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:14, cursor:'pointer', fontWeight:500 },
  btnSecondary:{ padding:'9px 18px', borderRadius:8, background:'#fff', color:'#374151', border:'1px solid #E5E7EB', fontSize:14, cursor:'pointer', fontWeight:500 },
  btnDanger:   { padding:'7px 14px', borderRadius:8, background:'#FEF2F2', color:'#991B1B', border:'1px solid #FECACA', fontSize:13, cursor:'pointer', fontWeight:500 },
};