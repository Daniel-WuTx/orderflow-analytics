// frontend/src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout }          = useAuth();
  const { totalItems }            = useCart();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const menuRef                   = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isAdmin  = ['admin','superadmin'].includes(user?.role);
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';

  // Cerrar menú al hacer click afuera
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/products" style={styles.brand}>
          <span style={styles.brandDot}/>
          Nexora Analytics
        </Link>
        <div style={styles.links}>
          <Link to="/products" style={isActive('/products') ? styles.linkActive : styles.link}>
            Productos
          </Link>
          {user && (
            <Link to="/orders" style={isActive('/orders') ? styles.linkActive : styles.link}>
              Mis órdenes
            </Link>
          )}
          {isAdmin && (
            <Link to="/dashboard" style={isActive('/dashboard') ? styles.linkActive : styles.link}>
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/users" style={isActive('/users') ? styles.linkActive : styles.link}>
              Usuarios
            </Link>
          )}
        </div>
      </div>

      <div style={styles.right}>
        {/* Carrito */}
        {user && (
          <Link to="/cart" style={styles.iconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9"  cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span style={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </Link>
        )}

        {/* Avatar con dropdown */}
        {user ? (
          <div style={{ position:'relative' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              style={styles.avatarBtn}
              title={user.name}
            >
              <div style={styles.avatarCircle}>{initials}</div>
              <span style={styles.avatarName}>{user.name.split(' ')[0]}</span>
              <span style={{ color:'#818CF8', fontSize:10, marginLeft:2 }}>▾</span>
            </button>

            {menuOpen && (
              <div style={styles.dropdown}>
                {/* Header del dropdown */}
                <div style={styles.dropHeader}>
                  <div style={styles.dropAvatar}>{initials}</div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#111827', margin:0 }}>{user.name}</p>
                    <p style={{ fontSize:11, color:'#6B7280', margin:0 }}>{user.email}</p>
                  </div>
                </div>

                <div style={styles.dropDivider}/>

                <Link to="/profile" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                  <span>👤</span> Mi perfil
                </Link>
                <Link to="/orders" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                  <span>📦</span> Mis órdenes
                </Link>
                <Link to="/cart" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                  <span>🛒</span> Mi carrito
                  {totalItems > 0 && <span style={styles.dropBadge}>{totalItems}</span>}
                </Link>

                {isAdmin && (
                  <>
                    <div style={styles.dropDivider}/>
                    <Link to="/dashboard" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <span>📊</span> Dashboard
                    </Link>
                    <Link to="/users" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <span>👥</span> Usuarios
                    </Link>
                  </>
                )}

                <div style={styles.dropDivider}/>
                <button onClick={handleLogout} style={styles.dropItemDanger}>
                  <span>🚪</span> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/login"    style={styles.link}>Iniciar sesión</Link>
            <Link to="/register" style={styles.btnRegister}>Registrarse</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav:           { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 2rem', height:56, background:'#1E1B4B', position:'sticky', top:0, zIndex:100 },
  left:          { display:'flex', alignItems:'center', gap:'2rem' },
  brand:         { display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:17, textDecoration:'none', color:'#fff', whiteSpace:'nowrap' },
  brandDot:      { width:8, height:8, borderRadius:'50%', background:'#818CF8', display:'inline-block', flexShrink:0 },
  links:         { display:'flex', gap:4 },
  link:          { textDecoration:'none', color:'#A5B4FC', fontSize:14, padding:'6px 12px', borderRadius:8 },
  linkActive:    { textDecoration:'none', color:'#fff', fontSize:14, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.1)' },
  right:         { display:'flex', alignItems:'center', gap:12 },
  iconBtn:       { position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.08)', color:'#A5B4FC', textDecoration:'none' },
  cartBadge:     { position:'absolute', top:-4, right:-4, background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' },
  avatarBtn:     { display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', padding:'5px 12px 5px 6px', borderRadius:20, cursor:'pointer' },
  avatarCircle:  { width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#818CF8,#4F46E5)', color:'#fff', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
  avatarName:    { fontSize:13, color:'#E0E7FF', fontWeight:500 },
  btnRegister:   { padding:'6px 14px', borderRadius:8, background:'#4F46E5', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:500 },

  // Dropdown
  dropdown:      { position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', minWidth:220, zIndex:200, overflow:'hidden' },
  dropHeader:    { display:'flex', alignItems:'center', gap:10, padding:'12px 14px' },
  dropAvatar:    { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#818CF8,#4F46E5)', color:'#fff', fontSize:13, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  dropDivider:   { height:1, background:'#F3F4F6', margin:'4px 0' },
  dropItem:      { display:'flex', alignItems:'center', gap:10, padding:'9px 14px', fontSize:13, color:'#374151', textDecoration:'none', cursor:'pointer', transition:'background 0.15s' },
  dropItemDanger:{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', fontSize:13, color:'#DC2626', background:'none', border:'none', width:'100%', cursor:'pointer', textAlign:'left' },
  dropBadge:     { marginLeft:'auto', background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, minWidth:18, height:18, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' },
};