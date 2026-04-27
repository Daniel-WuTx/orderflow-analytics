import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const isAdmin  = ['admin','superadmin'].includes(user?.role);
  const year     = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>

        {/* Top: Brand + Links */}
        <div style={styles.top}>

          {/* Brand */}
          <div style={styles.brand}>
            <div style={styles.brandName}>
              <span style={styles.brandDot}/>
              Nexora Analytics
            </div>
            <p style={styles.brandDesc}>
              Plataforma de e-commerce con motor de analytics en tiempo real. Construida con React, Node.js y PostgreSQL.
            </p>
          </div>

          {/* Links */}
          <div style={styles.linksGrid}>
            <div style={styles.linkCol}>
              <p style={styles.colTitle}>Tienda</p>
              <Link to="/products" style={styles.link}>Productos</Link>
              {user && <Link to="/cart"     style={styles.link}>Mi carrito</Link>}
              {user && <Link to="/orders"   style={styles.link}>Mis órdenes</Link>}
              {user && <Link to="/profile"  style={styles.link}>Mi perfil</Link>}
            </div>

            {isAdmin && (
              <div style={styles.linkCol}>
                <p style={styles.colTitle}>Administración</p>
                <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                <Link to="/users"     style={styles.link}>Usuarios</Link>
              </div>
            )}

            <div style={styles.linkCol}>
              <p style={styles.colTitle}>Cuenta</p>
              {user
                ? <Link to="/profile" style={styles.link}>Mi perfil</Link>
                : <>
                    <Link to="/login"    style={styles.link}>Iniciar sesión</Link>
                    <Link to="/register" style={styles.link}>Registrarse</Link>
                  </>
              }
            </div>

            <div style={styles.linkCol}>
              <p style={styles.colTitle}>Stack</p>
              <span style={styles.tag}>React + Vite</span>
              <span style={styles.tag}>Node.js</span>
              <span style={styles.tag}>PostgreSQL</span>
              <span style={styles.tag}>Redis</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider}/>

        {/* Bottom */}
        <div style={styles.bottom}>
          <p style={styles.copy}>© {year} Nexora Analytics. Todos los derechos reservados.</p>
          <p style={styles.made}>Hecho con ♥ por Daniel Wu</p>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer-top    { flex-direction: column !important; gap: 24px !important; }
          .footer-links  { grid-template-columns: 1fr 1fr !important; }
          .footer-bottom { flex-direction: column !important; gap: 4px !important; text-align: center; }
        }
      `}</style>
    </footer>
  );
}

const styles = {
  footer:      { background:'#1E1B4B', color:'#A5B4FC', marginTop:'auto' },
  container:   { maxWidth:1200, margin:'0 auto', padding:'2.5rem 1.5rem 1.5rem' },
  top:         { display:'flex', gap:40, flexWrap:'wrap', className:'footer-top' },
  brand:       { flex:'0 0 240px', minWidth:0 },
  brandName:   { display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:17, color:'#fff', marginBottom:10 },
  brandDot:    { width:8, height:8, borderRadius:'50%', background:'#818CF8', display:'inline-block', flexShrink:0 },
  brandDesc:   { fontSize:13, color:'#818CF8', lineHeight:1.6, margin:0 },
  linksGrid:   { flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:24 },
  linkCol:     { display:'flex', flexDirection:'column', gap:8 },
  colTitle:    { fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' },
  link:        { fontSize:13, color:'#A5B4FC', textDecoration:'none', lineHeight:1.4 },
  tag:         { fontSize:11, background:'rgba(255,255,255,0.08)', color:'#C7D2FE', padding:'3px 8px', borderRadius:20, display:'inline-block', width:'fit-content' },
  divider:     { height:1, background:'rgba(255,255,255,0.08)', margin:'1.5rem 0' },
  bottom:      { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 },
  copy:        { fontSize:12, color:'#6B7280', margin:0 },
  made:        { fontSize:12, color:'#6B7280', margin:0 },
};