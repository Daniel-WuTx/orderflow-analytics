// frontend/src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout }              = useAuth();
  const { totalItems }                = useCart();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const menuRef                       = useRef(null);
  const dropRef                       = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isAdmin  = ['admin','superadmin'].includes(user?.role);
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (dropRef.current  && !dropRef.current.contains(e.target))  setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav style={styles.nav}>
        {/* Brand */}
        <Link to="/products" style={styles.brand}>
          <span style={styles.brandDot}/>
          Nexora Analytics
        </Link>

        {/* Links desktop */}
        <div style={styles.linksDesktop}>
          <Link to="/products"  style={isActive('/products')  ? styles.linkActive : styles.link}>Productos</Link>
          {user && <Link to="/orders"    style={isActive('/orders')    ? styles.linkActive : styles.link}>Mis órdenes</Link>}
          {isAdmin && <Link to="/dashboard" style={isActive('/dashboard') ? styles.linkActive : styles.link}>Dashboard</Link>}
          {isAdmin && <Link to="/users"     style={isActive('/users')     ? styles.linkActive : styles.link}>Usuarios</Link>}
        </div>

        {/* Right desktop */}
        <div style={styles.rightDesktop}>
          {user && (
            <Link to="/cart" style={styles.iconBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && <span style={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>}
            </Link>
          )}

          {user ? (
            <div style={{ position:'relative' }} ref={dropRef}>
              <button onClick={() => setDropOpen(p => !p)} style={styles.avatarBtn}>
                <div style={styles.avatarCircle}>{initials}</div>
                <span style={styles.avatarName}>{user.name.split(' ')[0]}</span>
                <span style={{ color:'#818CF8', fontSize:10 }}>▾</span>
              </button>
              {dropOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropHeader}>
                    <div style={styles.dropAvatar}>{initials}</div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:'#111827', margin:0 }}>{user.name}</p>
                      <p style={{ fontSize:11, color:'#6B7280', margin:0 }}>{user.email}</p>
                    </div>
                  </div>
                  <div style={styles.dropDivider}/>
                  <Link to="/profile" style={styles.dropItem}>👤 Mi perfil</Link>
                  <Link to="/orders"  style={styles.dropItem}>📦 Mis órdenes</Link>
                  <Link to="/cart"    style={styles.dropItem}>
                    🛒 Mi carrito
                    {totalItems > 0 && <span style={styles.dropBadge}>{totalItems}</span>}
                  </Link>
                  {isAdmin && (<>
                    <div style={styles.dropDivider}/>
                    <Link to="/dashboard" style={styles.dropItem}>📊 Dashboard</Link>
                    <Link to="/users"     style={styles.dropItem}>👥 Usuarios</Link>
                  </>)}
                  <div style={styles.dropDivider}/>
                  <button onClick={handleLogout} style={styles.dropItemDanger}>🚪 Cerrar sesión</button>
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

        {/* Right mobile */}
        <div style={styles.rightMobile}>
          {user && (
            <Link to="/cart" style={styles.iconBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && <span style={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>}
            </Link>
          )}

          {/* Hamburguesa */}
          <div ref={menuRef}>
            <button onClick={() => setMenuOpen(p => !p)} style={styles.hamburger}>
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              )}
            </button>

            {/* Menú mobile */}
            {menuOpen && (
              <div style={styles.mobileMenu}>
                {user && (
                  <div style={styles.mobileUser}>
                    <div style={styles.dropAvatar}>{initials}</div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:600, color:'#111827', margin:0 }}>{user.name}</p>
                      <p style={{ fontSize:12, color:'#6B7280', margin:0 }}>{user.email}</p>
                    </div>
                  </div>
                )}
                <div style={styles.mobileDivider}/>

                <Link to="/products"  style={styles.mobileLink}>🛍️ Productos</Link>
                {user && <Link to="/cart"      style={styles.mobileLink}>🛒 Carrito {totalItems > 0 && `(${totalItems})`}</Link>}
                {user && <Link to="/orders"    style={styles.mobileLink}>📦 Mis órdenes</Link>}
                {user && <Link to="/profile"   style={styles.mobileLink}>👤 Mi perfil</Link>}

                {isAdmin && (<>
                  <div style={styles.mobileDivider}/>
                  <p style={styles.mobileSectionTitle}>Administración</p>
                  <Link to="/dashboard" style={styles.mobileLink}>📊 Dashboard</Link>
                  <Link to="/users"     style={styles.mobileLink}>👥 Usuarios</Link>
                </>)}

                <div style={styles.mobileDivider}/>
                {user
                  ? <button onClick={handleLogout} style={styles.mobileLinkDanger}>🚪 Cerrar sesión</button>
                  : <>
                      <Link to="/login"    style={styles.mobileLink}>Iniciar sesión</Link>
                      <Link to="/register" style={styles.mobileLink}>Registrarse</Link>
                    </>
                }
              </div>
            )}
          </div>
        </div>
      </nav>

      <style>{`
        @media (min-width: 641px) {
          .navbar-links-desktop { display: flex !important; }
          .navbar-right-desktop { display: flex !important; }
          .navbar-right-mobile  { display: none  !important; }
        }
        @media (max-width: 640px) {
          .navbar-links-desktop { display: none  !important; }
          .navbar-right-desktop { display: none  !important; }
          .navbar-right-mobile  { display: flex  !important; }
        }
      `}</style>
    </>
  );
}

const styles = {
  nav:              { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 1.25rem', height:56, background:'#1E1B4B', position:'sticky', top:0, zIndex:100 },
  brand:            { display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:16, textDecoration:'none', color:'#fff', whiteSpace:'nowrap', flexShrink:0 },
  brandDot:         { width:8, height:8, borderRadius:'50%', background:'#818CF8', display:'inline-block', flexShrink:0 },
  linksDesktop:     { display:'none', gap:4, className:'navbar-links-desktop' },
  rightDesktop:     { display:'none', alignItems:'center', gap:12, className:'navbar-right-desktop' },
  rightMobile:      { display:'flex', alignItems:'center', gap:10, className:'navbar-right-mobile' },
  link:             { textDecoration:'none', color:'#A5B4FC', fontSize:14, padding:'6px 10px', borderRadius:8 },
  linkActive:       { textDecoration:'none', color:'#fff', fontSize:14, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.1)' },
  iconBtn:          { position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)', color:'#A5B4FC', textDecoration:'none' },
  cartBadge:        { position:'absolute', top:-4, right:-4, background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, minWidth:16, height:16, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' },
  avatarBtn:        { display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', padding:'5px 12px 5px 6px', borderRadius:20, cursor:'pointer' },
  avatarCircle:     { width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#818CF8,#4F46E5)', color:'#fff', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
  avatarName:       { fontSize:13, color:'#E0E7FF', fontWeight:500 },
  btnRegister:      { padding:'6px 14px', borderRadius:8, background:'#4F46E5', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:500 },
  hamburger:        { background:'none', border:'none', color:'#A5B4FC', cursor:'pointer', padding:6, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8 },
  dropdown:         { position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', minWidth:220, zIndex:200, overflow:'hidden' },
  dropHeader:       { display:'flex', alignItems:'center', gap:10, padding:'12px 14px' },
  dropAvatar:       { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#818CF8,#4F46E5)', color:'#fff', fontSize:13, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  dropDivider:      { height:1, background:'#F3F4F6', margin:'4px 0' },
  dropItem:         { display:'flex', alignItems:'center', gap:10, padding:'9px 14px', fontSize:13, color:'#374151', textDecoration:'none', cursor:'pointer' },
  dropItemDanger:   { display:'flex', alignItems:'center', gap:10, padding:'9px 14px', fontSize:13, color:'#DC2626', background:'none', border:'none', width:'100%', cursor:'pointer', textAlign:'left' },
  dropBadge:        { marginLeft:'auto', background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, minWidth:18, height:18, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' },
  mobileMenu:       { position:'fixed', top:56, left:0, right:0, background:'#fff', borderBottom:'1px solid #E5E7EB', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:99, padding:'8px 0 16px', maxHeight:'calc(100vh - 56px)', overflowY:'auto' },
  mobileUser:       { display:'flex', alignItems:'center', gap:12, padding:'12px 16px' },
  mobileDivider:    { height:1, background:'#F3F4F6', margin:'6px 0' },
  mobileSectionTitle:{ fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', padding:'6px 16px 2px', margin:0 },
  mobileLink:       { display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:14, color:'#374151', textDecoration:'none', width:'100%' },
  mobileLinkDanger: { display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:14, color:'#DC2626', background:'none', border:'none', width:'100%', cursor:'pointer', textAlign:'left' },
};