async function uploadArtwork(blob) {
    try {
        // Generate a unique filename
        const fileName = crypto.randomUUID() + '.jpg';

        // 1️⃣ Upload file to Supabase Storage
        const { error: uploadError } = await supabase
            .storage
            .from('art')
            .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
            console.error('Upload error:', uploadError.message);
            alert('Failed to upload artwork.');
            return;
        }

        // 2️⃣ Get public URL for the uploaded file
        const { data: urlData, error: urlError } = supabase
            .storage
            .from('art')
            .getPublicUrl(fileName);

        if (urlError) {
            console.error('Error getting public URL:', urlError.message);
            alert('Failed to get public URL for artwork.');
            return;
        }

        const publicUrl = urlData.publicUrl;
        if (!publicUrl) {
            console.error('Public URL is undefined.');
            return;
        }

        // 3️⃣ Insert record into the artwork table
        const { error: dbError } = await supabase
            .from('artwork')
            .insert([{ image_url: publicUrl }]);

        if (dbError) {
            console.error('DB insert error:', dbError.message);
            alert('Failed to save artwork to database.');
            return;
        }

        // 4️⃣ Display artwork immediately in gallery
        addArtworkFromSrc(publicUrl, true);

        console.log('Artwork uploaded successfully:', publicUrl);
    } catch (err) {
        console.error('Unexpected error during upload:', err);
        alert('Unexpected error during upload.');
    }
}

