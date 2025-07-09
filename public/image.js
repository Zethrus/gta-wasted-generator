document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageDisplayCard = document.getElementById('image-display-card');
  const singleImage = document.getElementById('single-image');
  const viewCountEl = document.getElementById('view-count');
  const likeCountEl = document.getElementById('like-count');
  const likeBtn = document.getElementById('like-btn');
  const downloadBtn = document.getElementById('download-btn');
  const loadingStatus = document.getElementById('loading-status');

  // Get the image ID from the URL path
  const pathParts = window.location.pathname.split('/');
  const imageId = pathParts[pathParts.length - 1];

  async function loadImage() {
    if (!imageId) {
      loadingStatus.textContent = 'Invalid image ID.';
      return;
    }

    try {
      const response = await fetch(`/api/gallery/${imageId}`);
      if (!response.ok) throw new Error('Image not found.');

      const image = await response.json();

      // Populate the page with the image data
      singleImage.src = image.path;
      downloadBtn.href = image.path;
      viewCountEl.textContent = image.views;
      likeCountEl.textContent = image.likes;

      // Show the card and hide loading text
      imageDisplayCard.style.display = 'block';
      loadingStatus.style.display = 'none';

    } catch (error) {
      loadingStatus.textContent = 'Could not load image.';
      console.error(error);
    }
  }

  likeBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/api/gallery/${imageId}/like`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to submit like.');

      likeCountEl.textContent = parseInt(likeCountEl.textContent) + 1;
      likeBtn.disabled = true;
      likeBtn.textContent = 'Liked ❤️';
    } catch (error) {
      console.error('Error liking image:', error);
    }
  });

  // Social sharing logic (can be adapted from your main script.js)
  // ...

  loadImage();
});