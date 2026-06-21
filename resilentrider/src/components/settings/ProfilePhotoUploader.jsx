import { useRef, useState } from 'react';
import api from '../../api/axios';
import './ProfilePhotoUploader.css';

function ProfilePhotoUploader({ currentPhoto, name, onUploaded }) {
  const inputRef              = useRef(null);
  const [preview, setPreview] = useState(currentPhoto || null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPG, PNG or WEBP only'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Max 2 MB'); return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      setSaving(true);
      try {
        await api.put('/user/profile/update', { profilePhoto: dataUrl });
        onUploaded?.(dataUrl);
      } catch { setError('Upload failed'); }
      finally { setSaving(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    setPreview(null);
    try { await api.put('/user/profile/update', { profilePhoto: '' }); onUploaded?.(''); }
    catch {}
  };

  return (
    <div className="ppu">
      {/* Avatar — click to open file picker */}
      <div className="ppu__avatar" onClick={() => inputRef.current?.click()} title="Click to change photo">
        {preview
          ? <img src={preview} alt="Profile" className="ppu__img" />
          : <span className="ppu__initials">{initials}</span>
        }
        <div className="ppu__overlay">{saving ? '…' : '📷'}</div>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={handleFile} />

      {/* Single small action link */}
      <div className="ppu__links">
        <button className="ppu__link" onClick={() => inputRef.current?.click()}>
          {saving ? 'Saving…' : preview ? 'Change' : 'Upload'}
        </button>
        {preview && !saving && (
          <button className="ppu__link ppu__link--remove" onClick={handleRemove}>Remove</button>
        )}
      </div>

      {error && <p className="ppu__error">{error}</p>}
    </div>
  );
}

export default ProfilePhotoUploader;
