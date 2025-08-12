const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const status = document.getElementById('status');

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    } catch (err) {
        status.textContent = 'Kamera erişimi başarısız: ' + err.message;
        throw err;
    }
}

async function loadFaceApiModels() {
    if (typeof faceapi === 'undefined') {
        status.textContent = 'face-api.js yüklenemedi. Lütfen internet bağlantınızı kontrol edin veya kütüphaneyi tekrar yükleyin.';
        throw new Error('face-api.js is not defined');
    }
    try {
        const modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
        ]);
        status.textContent = 'Modeller yüklendi.';
    } catch (err) {
        status.textContent = 'Modeller yüklenemedi: ' + err.message;
        throw err;
    }
}

async function captureFaceDescriptor() {
    const detections = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detections) {
        status.textContent = 'Yüz algılanamadı. Lütfen kameraya bakın.';
        return null;
    }
    return detections.descriptor;
}

async function sendToBackend(descriptor) {
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faceDescriptor: Array.from(descriptor) })
        });

        const result = await response.json();
        if (response.ok && result.authenticated) {
            setTimeout(() => {
                window.location.href = "protectedsite.html";
            }, 1000);
            status.textContent = `Giriş başarılı! Hoş geldiniz, ${result.username || 'kullanıcı'}.`;
        } else {
            status.textContent = 'Giriş başarısız: Yüz tanınamadı veya kayıtlı değil.';
        }
    } catch (err) {
        status.textContent = 'Sunucu hatası: ' + err.message;
    }
}

startBtn.addEventListener('click', async () => {
    status.textContent = 'Kamera başlatılıyor...';
    try {
        await setupCamera();
        status.textContent = 'Modeller yükleniyor...';
        await loadFaceApiModels();

        status.textContent = 'Yüz taranıyor...';
        const descriptor = await captureFaceDescriptor();
        if (descriptor) {
            status.textContent = 'Yüz verisi gönderiliyor...';
            await sendToBackend(descriptor);
        }
    } catch (err) {
        status.textContent = 'Hata: ' + err.message;
    }
});
window.addEventListener('load', () => {
    if (typeof faceapi === 'undefined') {
        status.textContent = 'face-api.js yüklenemedi. Lütfen kütüphanenin doğru yüklendiğinden emin olun.';
    }
});