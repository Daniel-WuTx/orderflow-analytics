// frontend/src/pages/Products.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ImageCarousel from '../components/ImageCarousel';
import ImageManager from '../components/ImageManager';

const EMPTY = { name:'', description:'', price:'', stock:'', category_id:'' };

// ─── Skeleton card ────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={styles.card}>
    <div style={{ ...styles.skeletonBox, height:180, borderRadius:10, marginBottom:12 }}/>
    <div style={{ ...styles.skeletonBox, height:12, width:'60%', marginBottom:8 }}/>
    <div style={{ ...styles.skeletonBox, height:16, width:'80%', marginBottom:6 }}/>
    <div style={{ ...styles.skeletonBox, height:12, width:'90%', marginBottom:6 }}/>
    <div style={{ ...styles.skeletonBox, height:12, width:'50%', marginBottom:12 }}/>
    <div style={{ ...styles.skeletonBox, height:36, borderRadius:8 }}/>
  </div>
);

// ─── Partículas animadas para el hero ────────────────────────
const HeroCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165,180,252,${p.o})`;
        ctx.fill();
      });
      // líneas entre partículas cercanas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(165,180,252,${0.12 * (1 - dist/100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}/>;
};

export default function Products() {
  const { user }    = useAuth();
  const { addItem } = useCart();
  const isAdmin     = ['admin','superadmin'].includes(user?.role);

  const [products,      setProducts]      = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [productImages, setProductImages] = useState({});
  const [addingToCart,  setAddingToCart]  = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(null);

  // Filtros
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [sortBy,       setSortBy]       = useState('default');
  const [priceRange,   setPriceRange]   = useState([0, 1000]);
  const [viewMode,     setViewMode]     = useState('grid'); // grid | list
  const [detailProd,   setDetailProd]   = useState(null);

  // Categorías
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName,   setNewCatName]   = useState('');
  const [savingCat,    setSavingCat]    = useState(false);

  // Productos más vendidos (simulado con top products del analytics)
  const [topIds, setTopIds] = useState(new Set());

  const fetchImages = async (prods) => {
    const entries = await Promise.all(
      prods.map(async p => {
        try {
          const { data } = await api.get(`/products/${p.id}/images`);
          return [p.id, data];
        } catch { return [p.id, []]; }
      })
    );
    setProductImages(Object.fromEntries(entries));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
      await fetchImages(data.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    api.get('/products/categories').then(r => setCategories(r.data || []));
    // Intentar cargar top products si el usuario es admin
    if (['admin','superadmin'].includes(user?.role)) {
      api.get('/analytics/top-products?limit=5')
        .then(r => setTopIds(new Set((r.data.data || []).map(p => p.id))))
        .catch(() => {});
    }
  }, []);

  // Filtrado y ordenamiento en memoria
  const filtered = useMemo(() => {
    let list = [...products];

    if (search)     list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));
    if (filterCat)  list = list.filter(p => String(p.category_id) === String(filterCat));
    list = list.filter(p => parseFloat(p.price) >= priceRange[0] && parseFloat(p.price) <= priceRange[1]);

    if (sortBy === 'price_asc')  list.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === 'price_desc') list.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === 'name')       list.sort((a,b) => a.name.localeCompare(b.name));
    if (sortBy === 'stock')      list.sort((a,b) => b.stock - a.stock);

    return list;
  }, [products, search, filterCat, sortBy, priceRange]);

  const maxPrice = useMemo(() => Math.ceil(Math.max(...products.map(p => parseFloat(p.price)), 1000)), [products]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit   = (p) => {
    setEditing(p);
    setForm({ name:p.name, description:p.description||'', price:p.price, stock:p.stock, category_id:p.category_id||'' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Nombre y precio son requeridos');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post('/products', form);
      }
      await fetchProducts();
      setShowModal(false);
    } catch (err) { alert(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
    finally { setDeleting(null); }
  };

  const handleAddToCart = async (product, e) => {
    e?.stopPropagation();
    if (!user)              return alert('Debes iniciar sesión para agregar al carrito');
    if (product.stock === 0) return;
    setAddingToCart(product.id);
    try {
      await addItem(product.id, 1);
      setAddedFeedback(product.id);
      setTimeout(() => setAddedFeedback(null), 1500);
    } catch (err) { alert(err.response?.data?.error || 'Error al agregar al carrito'); }
    finally { setAddingToCart(null); }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const { data } = await api.post('/products/categories', { name: newCatName.trim() });
      setCategories(prev => [...prev, data]);
      setNewCatName('');
      setShowCatModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear categoría');
    } finally {
      setSavingCat(false);
    }
  };

  // Relacionados: misma categoría, distinto producto
  const related = detailProd
    ? products.filter(p => p.category_id === detailProd.category_id && p.id !== detailProd.id).slice(0, 4)
    : [];

  return (
    <div style={{ background:'#F8F9FB', minHeight:'100vh' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={styles.hero}>
        <HeroCanvas/>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>Nueva colección 2025</div>
          <h1 style={styles.heroTitle}>Descubre productos<br/>que te inspiran</h1>
          <p style={styles.heroSub}>Miles de productos seleccionados para ti. Envío rápido, pago seguro.</p>
          <div style={styles.heroSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              style={styles.heroSearchInput}
              placeholder="¿Qué estás buscando?"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:16, padding:'0 4px' }}>✕</button>
            )}
          </div>
          {/* Categorías rápidas */}
          <div style={styles.heroCats}>
            <button
              onClick={() => setFilterCat('')}
              style={{ ...styles.heroCatBtn, ...(filterCat === '' ? styles.heroCatActive : {}) }}
            >
              Todos
            </button>
            {categories.slice(0, 6).map(c => (
              <button
                key={c.id}
                onClick={() => setFilterCat(String(c.id))}
                style={{ ...styles.heroCatBtn, ...(filterCat === String(c.id) ? styles.heroCatActive : {}) }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BARRA DE FILTROS ──────────────────────────────── */}
      <div style={styles.filterBar}>
        <div style={styles.filterLeft}>
          <span style={{ fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>

          <select
            style={styles.select}
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select style={styles.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">Ordenar por</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
            <option value="stock">Disponibilidad</option>
          </select>

          <div style={styles.priceFilter}>
            <span style={{ fontSize:12, color:'#6B7280', whiteSpace:'nowrap' }}>
              Hasta ${priceRange[1].toLocaleString()}
            </span>
            <input
              type="range" min={0} max={maxPrice} step={10}
              value={priceRange[1]}
              onChange={e => setPriceRange([0, Number(e.target.value)])}
              style={{ width:100 }}
            />
          </div>
        </div>

        <div style={styles.filterRight}>
          {isAdmin && (
            <button onClick={openCreate} style={styles.btnPrimary}>+ Nuevo producto</button>
          )}
          {isAdmin && (
            <button onClick={() => setShowCatModal(true)} style={styles.btnSecondary}>+ Categoría</button>
          )}
          <div style={styles.viewToggle}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ ...styles.viewBtn, ...(viewMode === 'grid' ? styles.viewBtnActive : {}) }}
              title="Vista cuadrícula"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{ ...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {}) }}
              title="Vista lista"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* ── GRID / LIST ───────────────────────────────────── */}
      <div style={{ padding:'1.5rem 2rem', maxWidth:1400, margin:'0 auto' }}>
        {loading ? (
          <div style={viewMode === 'grid' ? styles.grid : styles.listView}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>🔍</div>
            <p style={{ fontSize:15, color:'#6B7280', marginBottom:8 }}>No se encontraron productos</p>
            <button onClick={() => { setSearch(''); setFilterCat(''); setSortBy('default'); setPriceRange([0, maxPrice]); }} style={styles.btnSecondary}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div style={viewMode === 'grid' ? styles.grid : styles.listView}>
            {filtered.map(p => (
              <div
                key={p.id}
                style={{ ...(viewMode === 'grid' ? styles.card : styles.listCard), cursor:'pointer' }}
                onClick={() => setDetailProd(p)}
              >
                {/* Badge más vendido */}
                {topIds.has(p.id) && (
                  <div style={styles.topBadge}>🔥 Más vendido</div>
                )}

                {viewMode === 'grid' ? (
                  <>
                    <ImageCarousel images={productImages[p.id] || []} productName={p.name}/>
                    <div style={styles.cardTop}>
                      <span style={styles.categoryBadge}>{p.category_name || 'Sin categoría'}</span>
                      {p.stock === 0 && <span style={styles.outStock}>Agotado</span>}
                      {p.stock > 0 && p.stock <= 5 && <span style={styles.lowStock}>¡Últimas {p.stock}!</span>}
                    </div>
                    <p style={styles.productName}>{p.name}</p>
                    <p style={styles.productDesc}>{p.description}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.price}>${Number(p.price).toLocaleString('es-CO', { minimumFractionDigits:2 })}</span>
                      <span style={p.stock > 0 ? styles.inStock : styles.outStockBadge}>
                        {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}
                      </span>
                    </div>
                    {user && (
                      <button
                        onClick={e => handleAddToCart(p, e)}
                        disabled={p.stock === 0 || addingToCart === p.id}
                        style={{ ...styles.btnCart, ...(addedFeedback === p.id ? styles.btnCartAdded : {}), ...(p.stock === 0 ? styles.btnCartDisabled : {}) }}
                      >
                        {addedFeedback === p.id ? '✓ Agregado' : addingToCart === p.id ? 'Agregando...' : p.stock === 0 ? 'Sin stock' : '+ Agregar al carrito'}
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <ImageManager productId={p.id} images={productImages[p.id] || []} onUpdate={async () => {
                          const { data } = await api.get(`/products/${p.id}/images`);
                          setProductImages(prev => ({ ...prev, [p.id]: data }));
                        }}/>
                        <div style={styles.cardActions} onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(p)} style={styles.btnEdit}>Editar</button>
                          <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} style={styles.btnDelete}>
                            {deleting === p.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* Vista lista */
                  <div style={styles.listInner}>
                    <div style={styles.listImg}>
                      <ImageCarousel images={productImages[p.id] || []} productName={p.name}/>
                    </div>
                    <div style={styles.listBody}>
                      <span style={styles.categoryBadge}>{p.category_name || 'Sin categoría'}</span>
                      <p style={{ ...styles.productName, fontSize:16, marginTop:4 }}>{p.name}</p>
                      <p style={styles.productDesc}>{p.description}</p>
                    </div>
                    <div style={styles.listRight}>
                      <span style={{ ...styles.price, fontSize:20 }}>${Number(p.price).toLocaleString('es-CO', { minimumFractionDigits:2 })}</span>
                      <span style={p.stock > 0 ? styles.inStock : styles.outStockBadge}>
                        {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}
                      </span>
                      {user && (
                        <button
                          onClick={e => handleAddToCart(p, e)}
                          disabled={p.stock === 0 || addingToCart === p.id}
                          style={{ ...styles.btnCart, ...(addedFeedback === p.id ? styles.btnCartAdded : {}), ...(p.stock === 0 ? styles.btnCartDisabled : {}), width:'160px' }}
                        >
                          {addedFeedback === p.id ? '✓ Agregado' : addingToCart === p.id ? 'Agregando...' : p.stock === 0 ? 'Sin stock' : '+ Al carrito'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE ─────────────────────────────────── */}
      {detailProd && (
        <div style={styles.overlay} onClick={() => setDetailProd(null)}>
          <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetailProd(null)} style={styles.closeBtn}>✕</button>

            <div style={styles.detailGrid}>
              {/* Galería */}
              <div style={styles.detailGallery}>
                <ImageCarousel images={productImages[detailProd.id] || []} productName={detailProd.name}/>
              </div>

              {/* Info */}
              <div style={styles.detailInfo}>
                <span style={styles.categoryBadge}>{detailProd.category_name || 'Sin categoría'}</span>
                {topIds.has(detailProd.id) && <span style={{ ...styles.topBadge, position:'static', marginLeft:6 }}>🔥 Más vendido</span>}
                <h2 style={{ fontSize:22, fontWeight:700, color:'#111827', margin:'10px 0 6px' }}>{detailProd.name}</h2>
                <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.7, marginBottom:16 }}>{detailProd.description || 'Sin descripción.'}</p>

                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:16 }}>
                  <span style={{ fontSize:28, fontWeight:800, color:'#4F46E5' }}>
                    ${Number(detailProd.price).toLocaleString('es-CO', { minimumFractionDigits:2 })}
                  </span>
                  <span style={detailProd.stock > 0 ? styles.inStock : styles.outStockBadge}>
                    {detailProd.stock > 0 ? `${detailProd.stock} disponibles` : 'Agotado'}
                  </span>
                </div>

                {detailProd.stock > 0 && detailProd.stock <= 5 && (
                  <p style={{ fontSize:13, color:'#DC2626', marginBottom:12 }}>⚡ ¡Solo quedan {detailProd.stock} unidades!</p>
                )}

                {user && (
                  <button
                    onClick={e => { handleAddToCart(detailProd, e); }}
                    disabled={detailProd.stock === 0 || addingToCart === detailProd.id}
                    style={{ ...styles.btnCart, ...( addedFeedback === detailProd.id ? styles.btnCartAdded : {}), ...(detailProd.stock === 0 ? styles.btnCartDisabled : {}), padding:'12px', fontSize:15, width:'100%' }}
                  >
                    {addedFeedback === detailProd.id ? '✓ Agregado al carrito' : addingToCart === detailProd.id ? 'Agregando...' : detailProd.stock === 0 ? 'Sin stock' : '🛒 Agregar al carrito'}
                  </button>
                )}

                {isAdmin && (
                  <div style={{ display:'flex', gap:8, marginTop:10 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setDetailProd(null); openEdit(detailProd); }} style={{ ...styles.btnEdit, flex:1, padding:'10px' }}>Editar</button>
                    <button onClick={() => { handleDelete(detailProd.id); setDetailProd(null); }} style={{ ...styles.btnDelete, flex:1, padding:'10px' }}>Eliminar</button>
                  </div>
                )}
              </div>
            </div>

            {/* Productos relacionados */}
            {related.length > 0 && (
              <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #F3F4F6' }}>
                <p style={{ fontSize:14, fontWeight:600, color:'#111827', marginBottom:14 }}>Productos relacionados</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12 }}>
                  {related.map(r => (
                    <div
                      key={r.id}
                      style={{ background:'#F9FAFB', borderRadius:10, padding:'0.75rem', cursor:'pointer', border:'1px solid #F0F0F0' }}
                      onClick={() => setDetailProd(r)}
                    >
                      <p style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:4 }}>{r.name}</p>
                      <p style={{ fontSize:14, fontWeight:700, color:'#4F46E5' }}>${Number(r.price).toLocaleString('es-CO', { minimumFractionDigits:2 })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL CREAR/EDITAR ────────────────────────────── */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre *</label>
                <input style={styles.input} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Nombre del producto"/>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Categoría</label>
                <select style={styles.input} value={form.category_id} onChange={e => setForm({...form, category_id:e.target.value})}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Precio *</label>
                <input style={styles.input} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price:e.target.value})} placeholder="0.00"/>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Stock</label>
                <input style={styles.input} type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} placeholder="0"/>
              </div>
              <div style={{...styles.field, gridColumn:'1 / -1'}}>
                <label style={styles.label}>Descripción</label>
                <textarea style={{...styles.input, height:80, resize:'vertical'}} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Descripción del producto"/>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} style={styles.btnPrimary}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA CATEGORÍA ────────────────────────── */}
      {showCatModal && (
        <div style={styles.overlay} onClick={() => setShowCatModal(false)}>
          <div style={{ ...styles.modal, maxWidth:380 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nueva categoría</h2>
              <button onClick={() => setShowCatModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nombre *</label>
              <input
                style={styles.input}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Ej: Tecnología"
                onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                autoFocus
              />
              <span style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>
                El slug se genera automáticamente a partir del nombre.
              </span>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => { setShowCatModal(false); setNewCatName(''); }} style={styles.btnCancel}>
                Cancelar
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={savingCat || !newCatName.trim()}
                style={styles.btnPrimary}
              >
                {savingCat ? 'Creando...' : 'Crear categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  // Hero
  hero:            { position:'relative', background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#1E1B4B 100%)', minHeight:420, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  heroContent:     { position:'relative', zIndex:1, textAlign:'center', padding:'3rem 2rem', animation:'fadeInUp 0.7s ease' },
  heroBadge:       { display:'inline-block', background:'rgba(165,180,252,0.2)', border:'1px solid rgba(165,180,252,0.4)', color:'#A5B4FC', fontSize:12, fontWeight:600, padding:'4px 14px', borderRadius:20, marginBottom:16, letterSpacing:'.06em' },
  heroTitle:       { fontSize:42, fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:12 },
  heroSub:         { fontSize:16, color:'#C7D2FE', marginBottom:28, maxWidth:480, margin:'0 auto 28px' },
  heroSearch:      { display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:12, padding:'10px 16px', maxWidth:480, margin:'0 auto 20px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' },
  heroSearchInput: { flex:1, border:'none', outline:'none', fontSize:15, color:'#111827', background:'transparent' },
  heroCats:        { display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 },
  heroCatBtn:      { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#C7D2FE', padding:'6px 16px', borderRadius:20, fontSize:13, cursor:'pointer', transition:'all 0.2s' },
  heroCatActive:   { background:'#4F46E5', border:'1px solid #4F46E5', color:'#fff' },

  // Filtros
  filterBar:       { background:'#fff', borderBottom:'1px solid #F0F0F0', padding:'0.75rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, position:'sticky', top:56, zIndex:50 },
  filterLeft:      { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  filterRight:     { display:'flex', alignItems:'center', gap:10 },
  select:          { padding:'6px 10px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, color:'#374151', background:'#fff', cursor:'pointer' },
  priceFilter:     { display:'flex', alignItems:'center', gap:8 },
  viewToggle:      { display:'flex', border:'1px solid #E5E7EB', borderRadius:8, overflow:'hidden' },
  viewBtn:         { background:'#fff', border:'none', padding:'6px 10px', cursor:'pointer', fontSize:16, color:'#9CA3AF' },
  viewBtnActive:   { background:'#EDE9FE', color:'#4F46E5' },

  // Grid/List
  grid:            { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:16 },
  listView:        { display:'flex', flexDirection:'column', gap:12 },
  card:            { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1.25rem', display:'flex', flexDirection:'column', gap:8, position:'relative', transition:'box-shadow 0.2s, transform 0.2s' },
  listCard:        { background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'1rem', position:'relative' },
  listInner:       { display:'flex', gap:16, alignItems:'center' },
  listImg:         { width:120, flexShrink:0, borderRadius:8, overflow:'hidden' },
  listBody:        { flex:1 },
  listRight:       { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, minWidth:160 },

  // Badges
  topBadge:        { position:'absolute', top:10, left:10, background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, zIndex:2 },
  categoryBadge:   { fontSize:11, background:'#EDE9FE', color:'#4C1D95', padding:'3px 8px', borderRadius:20, fontWeight:500, display:'inline-block' },
  outStock:        { fontSize:11, background:'#FEF2F2', color:'#991B1B', padding:'3px 8px', borderRadius:20 },
  lowStock:        { fontSize:11, background:'#FFF7ED', color:'#C2410C', padding:'3px 8px', borderRadius:20, fontWeight:600 },
  inStock:         { fontSize:11, background:'#ECFDF5', color:'#065F46', padding:'3px 8px', borderRadius:20 },
  outStockBadge:   { fontSize:11, background:'#FEF2F2', color:'#991B1B', padding:'3px 8px', borderRadius:20 },

  // Card content
  cardTop:         { display:'flex', justifyContent:'space-between', alignItems:'center' },
  productName:     { fontSize:15, fontWeight:600, color:'#111827', margin:0 },
  productDesc:     { fontSize:13, color:'#6B7280', lineHeight:1.5, flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },
  cardFooter:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 },
  price:           { fontSize:17, fontWeight:700, color:'#4F46E5' },
  cardActions:     { display:'flex', gap:8, paddingTop:10, borderTop:'1px solid #F3F4F6' },
  btnEdit:         { flex:1, padding:'6px', borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:13, cursor:'pointer', fontWeight:500 },
  btnDelete:       { flex:1, padding:'6px', borderRadius:8, border:'1px solid #FECACA', background:'#FEF2F2', color:'#991B1B', fontSize:13, cursor:'pointer', fontWeight:500 },
  btnCart:         { width:'100%', padding:'8px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontWeight:500, transition:'background 0.2s' },
  btnCartAdded:    { background:'#059669' },
  btnCartDisabled: { background:'#E5E7EB', color:'#9CA3AF', cursor:'not-allowed' },

  // Skeleton
  skeletonBox:     { background:'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' },

  // Empty
  emptyBox:        { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#fff', border:'1px solid #F0F0F0', borderRadius:12, padding:'3rem', textAlign:'center' },

  // Modales
  overlay:         { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem', backdropFilter:'blur(2px)' },
  detailModal:     { background:'#fff', borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:800, maxHeight:'90vh', overflowY:'auto', position:'relative' },
  detailGrid:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 },
  detailGallery:   { borderRadius:12, overflow:'hidden' },
  detailInfo:      { display:'flex', flexDirection:'column' },
  modal:           { background:'#fff', borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:520, margin:'0 1rem' },
  modalHeader:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' },
  modalTitle:      { fontSize:17, fontWeight:700, color:'#111827', margin:0 },
  closeBtn:        { background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#9CA3AF', padding:4, position:'absolute', top:16, right:16 },
  formGrid:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  field:           { display:'flex', flexDirection:'column', gap:6 },
  label:           { fontSize:13, fontWeight:500, color:'#374151' },
  input:           { padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, background:'#fff', color:'#111827', width:'100%' },
  modalFooter:     { display:'flex', justifyContent:'flex-end', gap:10, marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid #F3F4F6' },
  btnCancel:       { padding:'9px 18px', borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:14, cursor:'pointer' },
  btnPrimary:      { padding:'9px 18px', borderRadius:8, background:'#4F46E5', color:'#fff', border:'none', fontSize:14, cursor:'pointer', fontWeight:500 },
  btnSecondary:    { padding:'9px 18px', borderRadius:8, background:'#fff', color:'#374151', border:'1px solid #E5E7EB', fontSize:14, cursor:'pointer' },
};