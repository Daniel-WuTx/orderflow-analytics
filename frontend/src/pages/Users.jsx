import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { user: me } = useAuth();

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Reemplaza el botón toggleRole y la función por esto:

  const changeRole = async (u, newRole) => {
    setUpdating(u.id);
    try {
      const { data } = await api.patch(`/users/${u.id}/role`, { role: newRole });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: data.role } : x));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar rol');
    } finally {
      setUpdating(null);
    }
  };

  const admins    = users.filter(u => u.role === 'admin');
  const customers = users.filter(u => u.role === 'customer');

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
      <p style={{color:'#6B7280'}}>Cargando usuarios...</p>
    </div>
  );

  return (
    <div style={{background:'#F8F9FB', minHeight:'100vh'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #F0F0F0',padding:'1.25rem 2rem'}}>
        <h1 style={{fontSize:20,fontWeight:700,color:'#111827',margin:0}}>Gestión de usuarios</h1>
        <p style={{fontSize:13,color:'#6B7280',margin:'2px 0 0'}}>{users.length} usuarios registrados</p>
      </div>

      <div style={{padding:'1.5rem 2rem', maxWidth:1100, margin:'0 auto'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
          {[
            { label:'Total usuarios',  value: users.length,    color:'#4F46E5' },
            { label:'Administradores', value: admins.length,   color:'#10B981' },
            { label:'Clientes',        value: customers.length, color:'#F59E0B' },
          ].map(m => (
            <div key={m.label} style={{background:'#fff',border:'1px solid #F0F0F0',borderRadius:12,padding:'1rem 1.25rem'}}>
              <p style={{fontSize:12,color:'#6B7280',margin:'0 0 6px'}}>{m.label}</p>
              <p style={{fontSize:28,fontWeight:700,color:m.color,margin:0}}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={{background:'#fff',border:'1px solid #F0F0F0',borderRadius:12,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#F9FAFB'}}>
                {['Usuario','Email','Rol','Registrado','Acción'].map(h => (
                  <th key={h} style={{fontSize:11,color:'#9CA3AF',textAlign:'left',padding:'12px 16px',fontWeight:500,textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{borderTop:'1px solid #F3F4F6'}}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background: u.role==='admin' ? '#EDE9FE' : '#E0F2FE',color: u.role==='admin' ? '#4C1D95' : '#0369A1',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{fontSize:14,fontWeight:500,color:'#111827'}}>
                        {u.name}
                        {u.id === me?.id && <span style={{fontSize:11,color:'#9CA3AF',marginLeft:6}}>(tú)</span>}
                      </span>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:13,color:'#6B7280'}}>{u.email}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:12,padding:'3px 10px',borderRadius:20,fontWeight:500,
                      background: u.role==='admin' ? '#EDE9FE' : '#F3F4F6',
                      color:      u.role==='admin' ? '#4C1D95' : '#374151'}}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:13,color:'#9CA3AF'}}>
                    {new Date(u.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    {u.id === me?.id || u.role === 'superadmin'
                      ? <span style={{fontSize:12,color:'#078311'}}>—</span>
                      : me?.role === 'superadmin'
                        ? (
                          <div style={{display:'flex',gap:6}}>
                            {u.role !== 'admin' && (
                              <button onClick={() => changeRole(u,'admin')} disabled={updating===u.id}
                                style={{fontSize:12,padding:'4px 10px',borderRadius:8,border:'1px solid #A7F3D0',background:'#ECFDF5',color:'#065F46',cursor:'pointer'}}>
                                {updating===u.id ? '...' : 'Hacer admin'}
                              </button>
                            )}
                            {u.role !== 'customer' && (
                              <button onClick={() => changeRole(u,'customer')} disabled={updating===u.id}
                                style={{fontSize:12,padding:'4px 10px',borderRadius:8,border:'1px solid #FECACA',background:'#FEF2F2',color:'#991B1B',cursor:'pointer'}}>
                                {updating===u.id ? '...' : 'Quitar admin'}
                              </button>
                            )}
                          </div>
                        )
                        : <span style={{fontSize:12,color:'#D1D5DB'}}>Sin permisos</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}