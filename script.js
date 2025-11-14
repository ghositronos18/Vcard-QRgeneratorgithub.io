const form = document.getElementById('vcardForm');
const qrCanvas = document.getElementById('qrCanvas');
const qrLogo = document.getElementById('qrLogo');
const vcardPreview = document.getElementById('vcardPreview');
const qrHint = document.getElementById('qrHint');
const qrColorInput = document.getElementById('qrColor');
const qrGradientInput = document.getElementById('qrGradient');
const logoUpload = document.getElementById('logoUpload');

const generateBtn = document.getElementById('generateBtn');
const downloadVcfBtn = document.getElementById('downloadVcfBtn');
const downloadPngBtn = document.getElementById('downloadPngBtn');
const resetBtn = document.getElementById('resetBtn');

let qr = new QRious({
  element: qrCanvas,
  size: 260,
  value: '',
  background: '#ffffffff',
  foreground: '#06b6d4'
});
let latestVCard = '';
let customLogo = qrLogo.src;

// escape values for vCard
function escapeVcard(value = '') {
  return String(value)
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function escapeVcardNoSemi(value = '') {
  return String(value)
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,');   
}

//  Build vCard and WhatsApp link
function buildVCard() {
  const fn = `${form.firstName.value.trim()} ${form.lastName.value.trim()}`.trim();
  const n = `${form.lastName.value.trim()};${form.firstName.value.trim()}`;
  const phone = form.phone.value.trim();
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}`;

  const fields = [];
  fields.push('BEGIN:VCARD');
  fields.push('VERSION:3.0');
  fields.push(`N:${escapeVcardNoSemi(n)}`);
  fields.push(`FN:${escapeVcard(fn)}`);
  if (form.company.value) fields.push(`ORG:${escapeVcard(form.company.value)}`);
  if (form.title.value) fields.push(`TITLE:${escapeVcard(form.title.value)}`);
  if (form.phone.value) fields.push(`TEL;TYPE=WORK,VOICE:${escapeVcard(form.phone.value)}`);
  if (form.email.value) fields.push(`EMAIL:${escapeVcard(form.email.value)}`);
  if (form.website.value) fields.push(`URL:${escapeVcard(form.website.value)}`);
  if (form.address.value) fields.push(`ADR;TYPE=WORK:;;${escapeVcard(form.address.value)};;;;`);
  fields.push(`NOTE:WhatsApp Link - ${whatsappLink}`);
  if (form.notes.value) fields.push(`NOTE:${escapeVcard(form.notes.value)}`);
  fields.push('END:VCARD');

  return {
    vcard: fields.join('\r\n'),
    fullName: fn,
    title: form.title.value,
    company: form.company.value,
    phone,
    email: form.email.value,
    website: form.website.value,
    address: form.address.value,
    whatsappLink
  };
}

// Gradient drawing 
function drawGradientQR(color1, color2) {
  const ctx = qrCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
  const data = imgData.data;

  const grad = ctx.createLinearGradient(0, 0, qrCanvas.width, qrCanvas.height);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = qrCanvas.width;
  tempCanvas.height = qrCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.fillStyle = grad;
  tempCtx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);

  const gradData = tempCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128) {
      data[i] = gradData.data[i];
      data[i + 1] = gradData.data[i + 1];
      data[i + 2] = gradData.data[i + 2];
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// === QR with logo and round mask ===
function drawQRWithLogo(color1, color2) {
  const ctx = qrCanvas.getContext('2d');
  drawGradientQR(color1, color2);

  const size = qrCanvas.width;
  const logoSize = size * 0.23;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;
  const img = new Image();
  img.src = customLogo;
  img.onload = () => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, logoSize, logoSize, 10);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, logoSize, logoSize);
    ctx.drawImage(img, x, y, logoSize, logoSize);
    ctx.restore();
  };

}


function updatePreviewAndQR(data) {
  const { vcard, fullName, title, company, phone, email, website, address, whatsappLink } = data;

  // Business Card Style Preview
  vcardPreview.innerHTML = `

        <div class="card-header">
          <div class="logo">${company || 'COMPANY'}</div>
        </div>
        
        
        <div class="name-title">
          <div class="name">${fullName}</div>
          <div class="title">${title || 'Professional'}</div>
        </div>
        
        <div class="contact-info">
          <div class="contact-item">
            <div class="contact-icon"><i class="fas fa-phone"></i></div>
            <div class="contact-details">
              <a href="${whatsappLink}" target="_blank">${phone}</a>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon"><i class="fas fa-envelope"></i></div>
            <div class="contact-details">
              <a href="mailto:${email}" target="_blank">${email || 'your@email.com'}</a>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon"><i class="fas fa-globe"></i></div>
            <div class="contact-details">
              <a href="${website}" target="_blank">${website ? new URL(website).hostname : 'yourwebsite.com'}</a>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div>
            <div class="contact-details">
              <span>${address ? address.split(',')[0] : 'Your Location'}</span>
            </div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
            <span style="font-size: 12px;">Quality Service</span>
          </div>
        </div>
  `;

  qr.foreground = qrColorInput.value;
  qr.value = vcard;
  drawQRWithLogo(qrColorInput.value, qrGradientInput.value);

  qrHint.textContent = 'Scan to add contact via WhatsApp.';
  downloadVcfBtn.disabled = false;
  downloadPngBtn.disabled = false;
}

//  Logo upload 
logoUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    customLogo = ev.target.result;
    qrLogo.src = customLogo;
  };
  reader.readAsDataURL(file);
});

// Generate 
generateBtn.onclick = () => {
  const cardData = buildVCard();
  latestVCard = cardData.vcard;
  updatePreviewAndQR(cardData);
};

// Download VCF
downloadVcfBtn.onclick = () => {
  if (!latestVCard) return alert('Generate first!');
  const blob = new Blob([latestVCard], { type: 'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contact.vcf';
  a.click();
};

// Download PNG 
downloadPngBtn.onclick = () => {
  if (!latestVCard) return alert('Generate first!');
  qrCanvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qrcode.png';
    a.click();
  });
};

// Reset 
resetBtn.onclick = () => {
  form.reset();
  qr.value = '';
  latestVCard = '';
  uploadedLogo = null;
  qrLogo.classList.add('hidden');
  vcardPreview.textContent = 'Your generated vCard will appear here...';
  qrHint.textContent = 'QR will appear after generating.';
  downloadVcfBtn.disabled = true;
  downloadPngBtn.disabled = true;
  location.reload();

}

