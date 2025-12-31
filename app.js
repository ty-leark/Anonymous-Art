document.addEventListener('DOMContentLoaded', () => {
    // ---------------- Supabase Setup ----------------
    const supabaseUrl = 'https://iugyrqerbrpxzofopbmg.supabase.co';
    const supabaseKey = 'sb_publishable_yHOmZwW2k-irJZMCdr5ppw_c8Upqk_0';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const gallery = document.getElementById('gallery');
    const uploadInput = document.getElementById('uploadInput');
    const loader = document.getElementById('loader');

    // ---------------- Add artwork to DOM ----------------
    function addArtworkFromSrc(src, prepend = false) {
        const el = document.createElement('div');
        el.className = 'art';

        const img = document.createElement('img');
        img.src = src;
        img.alt = "User artwork";
        img.loading = "lazy";
        img.width = 600;
        img.height = 400;

        img.onerror = () => el.remove();

        el.appendChild(img);
        prepend ? gallery.prepend(el) : gallery.appendChild(el);
    }

    // ---------------- Load persisted artwork ----------------
    let page = 0;
    const PAGE_SIZE = 12;
    let isLoading = false;

    async function loadArtwork(offset = 0, limit = PAGE_SIZE) {
        if (isLoading) return;
        isLoading = true;
        loader.style.display = 'block';

        const { data, error } = await supabase
            .from('artwork')
            .select('image_url')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        loader.style.display = 'none';
        isLoading = false;

        if (error) {
            console.error('Error loading artwork:', error);
            return;
        }

        data.forEach(row => addArtworkFromSrc(row.image_url));
    }

    // Initial load
    loadArtwork(page * PAGE_SIZE, PAGE_SIZE);

    // Infinite scroll (older art at bottom)
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            page++;
            loadArtwork(page * PAGE_SIZE, PAGE_SIZE);
        }
    });

    // ---------------- Anonymous upload handling ----------------
    async function uploadArtwork(blob) {
        const fileName = crypto.randomUUID() + '.jpg';

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
            .storage
            .from('art')
            .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return;
        }

        // Get public URL
        const { data } = supabase
            .storage
            .from('art')
            .getPublicUrl(fileName);

        if (!data?.publicUrl) return;

        // Insert row in DB
        const { error: dbError } = await supabase
            .from('artwork')
            .insert({ image_url: data.publicUrl });

        if (dbError) {
            console.error('DB insert error:', dbError);
            return;
        }

        // Display immediately
        addArtworkFromSrc(data.publicUrl, true);
    }

    // Strip EXIF metadata before upload
    function stripMetadataAndUpload(file) {
    if (!file) return;

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

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width = width * scale;
                height = height * scale;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(blob => uploadArtwork(blob), 'image/jpeg', 0.95);
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

    // Trigger upload on file select
    uploadInput.addEventListener('change', () => {
        const file = uploadInput.files[0];
        stripMetadataAndUpload(file);
        uploadInput.value = '';
    });
});
