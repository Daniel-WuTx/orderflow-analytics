import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  const fetchProducts = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?search=${q}`);
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Productos</h2>
        <input
          style={styles.search}
          placeholder="Buscar producto..."
          value={search}
          onChange={e => { setSearch(e.target.value); fetchProducts(e.target.value); }}
        />
      </div>

      {loading ? <p>Cargando...</p> : (
        <div style={styles.grid}>
          {products.map(p => (
            <div key={p.id} style={styles.card}>
              <p style={styles.name}>{p.name}</p>
              <p style={styles.category}>{p.category_name}</p>
              <p style={styles.desc}>{p.description}</p>
              <div style={styles.footer}>
                <span style={styles.price}>${p.price}</span>
                <span style={p.stock > 0 ? styles.inStock : styles.outStock}>
                  {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page:     { padding:'2rem', maxWidth:'1100px', margin:'0 auto' },
  header:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' },
  title:    { fontSize:'22px', fontWeight:500, margin:0 },
  search:   { padding:'9px 14px', borderRadius:'8px', border:'1px solid #e0e0e0', fontSize:'14px', width:'240px' },
  grid:     { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'16px' },
  card:     { background:'#fff', border:'1px solid #f0f0f0', borderRadius:'12px', padding:'1.25rem' },
  name:     { fontWeight:500, fontSize:'16px', margin:'0 0 4px' },
  category: { fontSize:'12px', color:'#6B7280', margin:'0 0 8px' },
  desc:     { fontSize:'14px', color:'#374151', margin:'0 0 12px', lineHeight:1.5 },
  footer:   { display:'flex', justifyContent:'space-between', alignItems:'center' },
  price:    { fontWeight:600, fontSize:'16px', color:'#4F46E5' },
  inStock:  { fontSize:'12px', color:'#059669', background:'#ECFDF5', padding:'3px 8px', borderRadius:'6px' },
  outStock: { fontSize:'12px', color:'#DC2626', background:'#FEF2F2', padding:'3px 8px', borderRadius:'6px' },
};