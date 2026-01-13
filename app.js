// ---------------- Triggered when user selects a file ----------------
uploadInput.addEventListener('change', () => {
    const file = uploadInput.files[0];
    if (!file) return;

    // Strip metadata and resize before uploading
    stripMetadataAndUpload(file);

    // Reset input so same file can be uploaded again if needed
    uploadInput.value = '';
});

// ---------------- Strip EXIF metadata and resize ----------------
function stripMetadataAndUpload(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 2000;

    if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WEBP images are allowed.');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        alert('Image is too large. Max 5 MB allowed.');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Resize if too large
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width *= scale;
                height *= scale;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob and upload
            canvas.toBlob(blob => uploadArtwork(blob), 'image/jpeg', 0.95);
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}
