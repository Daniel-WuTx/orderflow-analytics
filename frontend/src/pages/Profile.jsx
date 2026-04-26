// frontend/src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const fmt     = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' }) : '—';

const ROLE_META = {
  superadmin: { label:'Super Admin', bg:'#FEF3C7', color:'#92400E' },
  admin:      { label:'Admin',       bg:'#EDE9FE', color:'#4C1D95' },
  customer:   { label:'Cliente',     bg:'#ECFDF5', color:'#065F46' },
};

const CAT_COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];

// ── Stat card ────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1rem 1.25rem' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'#6B7280' }}>{label}</span>
      <span style={{ fontSize:20 }}>{icon}</span>
    </div>
    <div style={{ fontSize:24, fontWeight:700, color: color || '#111827', lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>{sub}</div>}
  </div>
);

// ── Barra de categoría ───────────────────────────────────────
const CategoryBar = ({ name, spent, maxSpent, color }) => {
  const pct = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{name}</span>
        <span style={{ fontSize:13, color:'#6B7280' }}>${fmt(spent)}</span>
      </div>
      <div style={{ background:'#F3F4F6', borderRadius:6, height:8, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:6, transition:'width 0.8s ease' }}/>
      </div>
    </div>
  );
};

export default function Profile() {
  const { user, logout }              = useAuth();
  const { addItem }                   = useCart();
  const navigate                      = useNavigate();
  const [profile,    setProfile]      = useState(null);
  const [loading,    setLoading]      = useState(true);
  const [addingCart, setAddingCart]   = useState(null);
  const [addedFb,    setAddedFb]      = useState(null);
  const [activeTab,  setActiveTab]    = useState('overview');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/analytics/profile/me')
      .then(r => setProfile(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleAddToCart = async (product) => {
    if (product.stock === 0) return;
    setAddingCart(product.id);
    try {
      await addItem(product.id, 1);
      setAddedFb(product.id);
      setTimeout(() => setAddedFb(null), 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar');
    } finally {
      setAddingCart(null);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleMeta  = ROLE_META[user?.role] || ROLE_META.customer;
  const maxSpent  = profile ? Math.max(...profile.topCategories.map(c => parseFloat(c.spent)), 1) : 1;
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';

  if (!user) return null;

  return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>

      {/* ── Hero del perfil ──────────────────────────────── */}
      <div style={styles.profileHero}>
        <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'2rem', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          {/* Avatar */}
          <div style={styles.avatar}>{initials}</div>

          {/* Info */}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', margin:0 }}>{user.name}</h1>
              <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:600, background:roleMeta.bg, color:roleMeta.color }}>
                {roleMeta.label}
              </span>
            </div>
            <p style={{ fontSize:14, color:'#A5B4FC', margin:'0 0 4px' }}>{user.email}</p>
            {profile && (
              <p style={{ fontSize:13, color:'#818CF8', margin:0 }}>
                Última compra: {fmtDate(profile.stats.lastOrderAt)}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => navigate('/orders')} style={styles.heroBtn}>
              📦 Mis órdenes
            </button>
            <button onClick={handleLogout} style={styles.heroBtnDanger}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div style={styles.tabBar}>
        {[
          { key:'overview',       label:'Resumen'          },
          { key:'products',       label:'Mis productos'    },
          { key:'recommendations',label:'Recomendaciones'  },
          { key:'categories',     label:'Mis categorías'   },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'1.5rem 2rem', maxWidth:1100, margin:'0 auto' }}>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background:'#fff', borderRadius:12, height:100, border:'1px solid #F0F0F0',
                backgroundImage:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)',
                backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }}/>
            ))}
          </div>
        ) : !profile ? (
          <div style={styles.emptyBox}>
            <p style={{ color:'#6B7280' }}>No se pudo cargar el perfil.</p>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────── */}
            {activeTab === 'overview' && (
              <div>
                <div style={styles.statsGrid}>
                  <StatCard icon="🛒" label="Total órdenes"   value={profile.stats.totalOrders}  color="#111827"/>
                  <StatCard icon="✅" label="Entregadas"       value={profile.stats.delivered}    color="#059669"/>
                  <StatCard icon="⏳" label="En proceso"       value={profile.stats.active}       color="#D97706"/>
                  <StatCard icon="💰" label="Total gastado"
                    value={`$${fmt(profile.stats.totalSpent)}`}
                    sub="En órdenes entregadas"
                    color="#4F46E5"
                    icon="💰"
                  />
                </div>

                {/* Resumen visual */}
                <div style={styles.twoCol}>
                  {/* Categorías top */}
                  <div style={styles.panel}>
                    <p style={styles.panelTitle}>Categorías favoritas</p>
                    {profile.topCategories.length === 0 ? (
                      <p style={styles.emptyTxt}>Sin compras registradas aún.</p>
                    ) : (
                      profile.topCategories.map((c, i) => (
                        <CategoryBar key={c.category} name={c.category} spent={parseFloat(c.spent)} maxSpent={maxSpent} color={CAT_COLORS[i % CAT_COLORS.length]}/>
                      ))
                    )}
                  </div>

                  {/* Producto más comprado */}
                  <div style={styles.panel}>
                    <p style={styles.panelTitle}>Productos más comprados</p>
                    {profile.topProducts.length === 0 ? (
                      <p style={styles.emptyTxt}>Sin compras entregadas aún.</p>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {profile.topProducts.slice(0,4).map((p, i) => (
                          <div key={p.id} style={styles.topProdRow}>
                            <div style={{ ...styles.rank, background: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : '#FFF7ED', color: i === 0 ? '#92400E' : '#6B7280' }}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
                            </div>
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:13, fontWeight:500, color:'#374151', margin:0 }}>{p.name}</p>
                              <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>{p.times_bought}x comprado</p>
                            </div>
                            <span style={{ fontSize:13, fontWeight:600, color:'#4F46E5' }}>${fmt(p.total_spent)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── MIS PRODUCTOS ────────────────────────── */}
            {activeTab === 'products' && (
              <div>
                <p style={styles.sectionDesc}>Productos que has comprado y recibido</p>
                {profile.topProducts.length === 0 ? (
                  <div style={styles.emptyBox}>
                    <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>🛍️</div>
                    <p style={{ color:'#6B7280', marginBottom:16 }}>Aún no tienes compras entregadas</p>
                    <button onClick={() => navigate('/products')} style={styles.btnPrimary}>Ver productos</button>
                  </div>
                ) : (
                  <div style={styles.prodGrid}>
                    {profile.topProducts.map(p => (
                      <div key={p.id} style={styles.prodCard}>
                        <div style={styles.prodAvatar}>{p.name.charAt(0).toUpperCase()}</div>
                        <p style={{ fontSize:14, fontWeight:600, color:'#111827', margin:'0 0 4px', textAlign:'center' }}>{p.name}</p>
                        <p style={{ fontSize:13, color:'#4F46E5', fontWeight:700, margin:'0 0 2px' }}>${fmt(p.price)}</p>
                        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 12px' }}>Comprado {p.times_bought}x</p>
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={addingCart === p.id}
                          style={{ ...styles.btnCart, ...(addedFb === p.id ? styles.btnCartAdded : {}) }}
                        >
                          {addedFb === p.id ? '✓ Agregado' : addingCart === p.id ? '...' : '+ Al carrito'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── RECOMENDACIONES ──────────────────────── */}
            {activeTab === 'recommendations' && (
              <div>
                <p style={styles.sectionDesc}>Basado en tus categorías favoritas</p>
                {profile.recommendations.length === 0 ? (
                  <div style={styles.emptyBox}>
                    <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>✨</div>
                    <p style={{ color:'#6B7280', marginBottom:16 }}>Haz tu primera compra para recibir recomendaciones</p>
                    <button onClick={() => navigate('/products')} style={styles.btnPrimary}>Explorar productos</button>
                  </div>
                ) : (
                  <div style={styles.prodGrid}>
                    {profile.recommendations.map(p => (
                      <div key={p.id} style={styles.prodCard}>
                        <div style={{ ...styles.prodAvatar, background:'#ECFDF5', color:'#065F46' }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize:11, background:'#EDE9FE', color:'#4C1D95', padding:'2px 8px', borderRadius:20, marginBottom:6, display:'inline-block' }}>
                          {p.category_name}
                        </span>
                        <p style={{ fontSize:14, fontWeight:600, color:'#111827', margin:'4px 0', textAlign:'center' }}>{p.name}</p>
                        <p style={{ fontSize:13, color:'#4F46E5', fontWeight:700, margin:'0 0 4px' }}>${fmt(p.price)}</p>
                        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 12px' }}>{p.stock} en stock</p>
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={p.stock === 0 || addingCart === p.id}
                          style={{ ...styles.btnCart, ...(addedFb === p.id ? styles.btnCartAdded : {}), ...(p.stock === 0 ? styles.btnCartDisabled : {}) }}
                        >
                          {addedFb === p.id ? '✓ Agregado' : addingCart === p.id ? '...' : p.stock === 0 ? 'Sin stock' : '+ Al carrito'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CATEGORÍAS ───────────────────────────── */}
            {activeTab === 'categories' && (
              <div>
                <p style={styles.sectionDesc}>Tus categorías por gasto total en compras entregadas</p>
                {profile.topCategories.length === 0 ? (
                  <div style={styles.emptyBox}>
                    <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>📂</div>
                    <p style={{ color:'#6B7280' }}>Sin datos de categorías aún</p>
                  </div>
                ) : (
                  <div style={styles.catGrid}>
                    {profile.topCategories.map((c, i) => (
                      <div key={c.category} style={{ ...styles.catCard, borderTop:`3px solid ${CAT_COLORS[i % CAT_COLORS.length]}` }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>
                          {['🖥️','👕','🏠','⚽','📚','🧸','💄','🍎'][i] || '📦'}
                        </div>
                        <p style={{ fontSize:16, fontWeight:700, color:'#111827', margin:'0 0 4px' }}>{c.category}</p>
                        <p style={{ fontSize:22, fontWeight:800, color:CAT_COLORS[i % CAT_COLORS.length], margin:'0 0 4px' }}>
                          ${fmt(c.spent)}
                        </p>
                        <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>{c.units} unidades compradas</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
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
  profileHero:    { background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 60%,#1E1B4B 100%)', position:'relative', overflow:'hidden' },
  avatar:         { width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#818CF8,#4F46E5)', color:'#fff', fontSize:24, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid rgba(255,255,255,0.2)', flexShrink:0 },
  heroBtn:        { padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:500 },
  heroBtnDanger:  { padding:'8px 16px', borderRadius:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#FCA5A5', fontSize:13, cursor:'pointer' },
  tabBar:         { background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'0 2rem', display:'flex', gap:4, overflowX:'auto' },
  tab:            { padding:'12px 16px', border:'none', background:'none', color:'#6B7280', fontSize:14, cursor:'pointer', borderBottom:'2px solid transparent', whiteSpace:'nowrap' },
  tabActive:      { color:'#4F46E5', borderBottom:'2px solid #4F46E5', fontWeight:600 },
  statsGrid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:20 },
  twoCol:         { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  panel:          { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.25rem' },
  panelTitle:     { fontSize:14, fontWeight:700, color:'#111827', margin:'0 0 16px' },
  emptyTxt:       { fontSize:13, color:'#9CA3AF', textAlign:'center', padding:'1rem 0' },
  topProdRow:     { display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#F9FAFB', borderRadius:8 },
  rank:           { width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  prodGrid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 },
  prodCard:       { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.25rem', display:'flex', flexDirection:'column', alignItems:'center' },
  prodAvatar:     { width:56, height:56, borderRadius:14, background:'#EDE9FE', color:'#4C1D95', fontSize:22, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 },
  catGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 },
  catCard:        { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.5rem', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' },
  sectionDesc:    { fontSize:14, color:'#6B7280', marginBottom:16 },
  emptyBox:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'3rem', textAlign:'center' },
  btnPrimary:     { padding:'9px 18px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:14, cursor:'pointer', fontWeight:500 },
  btnCart:        { width:'100%', padding:'7px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontWeight:500 },
  btnCartAdded:   { background:'#059669' },
  btnCartDisabled:{ background:'#E5E7EB', color:'#9CA3AF', cursor:'not-allowed' },
};