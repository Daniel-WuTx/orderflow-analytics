import { useState } from 'react';

export default function ImageCarousel({ images, productName }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return (
    <div style={styles.placeholder}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <p style={{fontSize:13,color:'#9CA3AF',marginTop:8}}>Sin imágenes</p>
    </div>
  );

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <div style={styles.wrapper}>

      {/* Imagen principal */}
      <div style={styles.mainImg}>
        <img
          src={`http://localhost:3000${images[current].url}`}
          alt={`${productName} ${current + 1}`}
          style={styles.img}
        />
        {images.length > 1 && <>
          <button onClick={prev} style={{...styles.arrow, left:8}}>‹</button>
          <button onClick={next} style={{...styles.arrow, right:8}}>›</button>
          <div style={styles.counter}>{current + 1} / {images.length}</div>
        </>}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div style={styles.thumbs}>
          {images.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setCurrent(i)}
              style={{
                ...styles.thumb,
                border: i === current ? '2px solid #4F46E5' : '2px solid transparent',
              }}
            >
              <img
                src={`http://localhost:3000${img.url}`}
                alt={`miniatura ${i+1}`}
                style={styles.thumbImg}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper:    { display:'flex', flexDirection:'column', gap:8 },
  placeholder:{ height:200, background:'#F9FAFB', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed #E5E7EB' },
  mainImg:    { position:'relative', height:220, background:'#F9FAFB', borderRadius:10, overflow:'hidden' },
  img:        { width:'100%', height:'100%', objectFit:'cover' },
  arrow:      { position:'absolute', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.9)', border:'none', borderRadius:'50%', width:32, height:32, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151', fontWeight:700 },
  counter:    { position:'absolute', bottom:8, right:10, background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:11, padding:'2px 8px', borderRadius:10 },
  thumbs:     { display:'flex', gap:6, flexWrap:'wrap' },
  thumb:      { width:52, height:52, borderRadius:6, overflow:'hidden', cursor:'pointer' },
  thumbImg:   { width:'100%', height:'100%', objectFit:'cover' },
};