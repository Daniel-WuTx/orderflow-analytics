import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const { login }           = useAuth();
  const navigate            = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/dashboard' : '/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email" placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={styles.input}
            type="password" placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button style={styles.btn} type="submit">Entrar</button>
        </form>
        <p style={styles.link}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh' },
  card:  { background:'#fff', padding:'2rem', borderRadius:'12px', boxShadow:'0 2px 16px #0001', width:'100%', maxWidth:'380px' },
  title: { marginBottom:'1.5rem', fontSize:'22px', fontWeight:500 },
  form:  { display:'flex', flexDirection:'column', gap:'12px' },
  input: { padding:'10px 14px', borderRadius:'8px', border:'1px solid #e0e0e0', fontSize:'15px' },
  btn:   { padding:'11px', borderRadius:'8px', background:'#4F46E5', color:'#fff', border:'none', fontSize:'15px', cursor:'pointer' },
  error: { color:'#dc2626', fontSize:'14px', marginBottom:'8px' },
  link:  { textAlign:'center', marginTop:'1rem', fontSize:'14px' },
};