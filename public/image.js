document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageDisplayCard = document.getElementById('image-display-card');
  const singleImage = document.getElementById('single-image');
  const viewCountEl = document.getElementById('view-count');
  const likeCountEl = document.getElementById('like-count');
  const likeBtn = document.getElementById('like-btn');
  const downloadBtn = document.getElementById('download-btn');
  const loadingStatus = document.getElementById('loading-status');
  // Social Share Buttons
  const shareTwitterBtn = document.getElementById('share-twitter-btn');
  const shareFacebookBtn = document.getElementById('share-facebook-btn');
  const shareRedditBtn = document.getElementById('share-reddit-btn');

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

  // --- NEW: Social Sharing Logic ---
  const shareOnSocialMedia = (platformUrl) => {
    if (!singleImage.src) return; // Don't share if there's no image

    const imageUrl = new URL(singleImage.src, window.location.href).href;
    const text = encodeURIComponent("Check out this image I made with the GTA Wasted Generator!");
    let fullUrl;

    if (platformUrl.includes('facebook')) {
      fullUrl = `${platformUrl}?u=${encodeURIComponent(imageUrl)}`;
    } else if (platformUrl.includes('reddit')) {
      const title = encodeURIComponent("GTA Wasted Generator");
      fullUrl = `${platformUrl}?url=${encodeURIComponent(imageUrl)}&title=${title}`;
    } else { // Twitter
      fullUrl = `${platformUrl}?text=${text}&url=${encodeURIComponent(imageUrl)}`;
    }

    window.open(fullUrl, '_blank', 'width=600,height=400');
  };

  shareTwitterBtn.addEventListener('click', () => {
    shareOnSocialMedia('https://twitter.com/intent/tweet');
  });

  shareFacebookBtn.addEventListener('click', () => {
    shareOnSocialMedia('https://www.facebook.com/sharer/sharer.php');
  });

  shareRedditBtn.addEventListener('click', () => {
    shareOnSocialMedia('https://www.reddit.com/submit');
  });

  loadImage();
});