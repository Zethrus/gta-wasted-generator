document.addEventListener('DOMContentLoaded', () => {
  const galleryGrid = document.getElementById('gallery-grid');
  const loadingMessage = document.getElementById('loading-message');

  fetch('/api/gallery')
    .then(response => response.json())
    .then(images => {
      loadingMessage.style.display = 'none'; // Hide loading message

      if (images.length === 0) {
        galleryGrid.innerHTML = '<p>The gallery is empty. Be the first to add a public image!</p>';
        return;
      }

      images.forEach(image => {
        const imgElement = document.createElement('img');
        imgElement.src = `/uploads/${image.fileName}`;
        imgElement.alt = 'A user-generated Wasted image';
        imgElement.loading = 'lazy'; // Lazy load images
        galleryGrid.appendChild(imgElement);
      });
    })
    .catch(error => {
      console.error('Failed to load gallery:', error);
      galleryGrid.innerHTML = '<p>Could not load the gallery at this time. Please try again later.</p>';
    });
});