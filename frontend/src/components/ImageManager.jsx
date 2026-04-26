import { useState } from 'react';
import api from '../api/axios';

export default function ImageManager({ productId, images, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      await api.post(`/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    setDeleting(imageId);
    try {
      await api.delete(`/products/${productId}/images/${imageId}`);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={styles.wrapper}>
      <p style={styles.title}>Imágenes ({images.length}/6)</p>

      <div style={styles.grid}>
        {images.map(img => (
          <div key={img.id} style={styles.imgWrap}>
            <img
              src={`http://localhost:3000${img.url}`}
              alt="producto"
              style={styles.img}
            />
            <button
              onClick={() => handleDelete(img.id)}
              disabled={deleting === img.id}
              style={styles.deleteBtn}
            >
              {deleting === img.id ? '...' : '✕'}
            </button>
          </div>
        ))}

        {images.length < 6 && (
          <label style={styles.uploadBtn}>
            {uploading ? (
              <span style={{fontSize:12,color:'#6B7280'}}>Subiendo...</span>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span style={{fontSize:12,color:'#9CA3AF'}}>Añadir</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              style={{display:'none'}}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper:   { marginTop:16, paddingTop:16, borderTop:'1px solid #F3F4F6' },
  title:     { fontSize:13, fontWeight:500, color:'#374151', marginBottom:10 },
  grid:      { display:'flex', flexWrap:'wrap', gap:8 },
  imgWrap:   { position:'relative', width:72, height:72, borderRadius:8, overflow:'hidden', border:'1px solid #E5E7EB' },
  img:       { width:'100%', height:'100%', objectFit:'cover' },
  deleteBtn: { position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.55)', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  uploadBtn: { width:72, height:72, borderRadius:8, border:'2px dashed #E5E7EB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:4 },
};