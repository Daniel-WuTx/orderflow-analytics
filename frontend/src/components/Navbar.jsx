import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <Link to="/products" style={styles.brand}>OrderFlow</Link>
      <div style={styles.links}>
        <Link to="/products" style={styles.link}>Productos</Link>
        {user?.role === 'admin' &&
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>}
        {user
          ? <button style={styles.btn} onClick={handleLogout}>Salir</button>
          : <Link to="/login" style={styles.link}>Login</Link>}
      </div>
    </nav>
  );
}

const styles = {
  nav:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 2rem', background:'#fff', borderBottom:'1px solid #f0f0f0' },
  brand:  { fontWeight:600, fontSize:'18px', textDecoration:'none', color:'#4F46E5' },
  links:  { display:'flex', alignItems:'center', gap:'1.5rem' },
  link:   { textDecoration:'none', color:'#374151', fontSize:'15px' },
  btn:    { background:'none', border:'1px solid #e0e0e0', padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'14px' },
};