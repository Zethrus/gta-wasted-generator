document.addEventListener('DOMContentLoaded', () => {
  const galleryGrid = document.getElementById('gallery-grid');
  const loadingMessage = document.getElementById('loading-message');
  const galleryStatus = document.getElementById('gallery-status');

  /**
   * Fetches images from the server and populates the gallery.
   */
  async function loadGallery() {
    try {
      // Fetch images from the correct endpoint defined in server.js
      const response = await fetch('/gallery-images');

      // Check if the server responded with an error status (like 404 or 500)
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const images = await response.json();

      // Clear the "Loading..." message
      galleryGrid.innerHTML = '';

      if (images.length === 0) {
        galleryStatus.textContent = 'The gallery is empty. Be the first to add a public image!';
      } else {
        // Hide the status message if images were found
        galleryStatus.style.display = 'none';

        // Loop through each image object and create an img element for it
        images.forEach(image => {
          const imgElement = document.createElement('img');
          imgElement.src = image.path;
          imgElement.alt = 'A user-generated image with the Wasted banner.';

          // Add a title with the creation date for a nice hover effect
          const createdDate = new Date(image.createdAt).toLocaleString();
          imgElement.title = `Created: ${createdDate}`;

          galleryGrid.appendChild(imgElement);
        });
      }

    } catch (error) {
      console.error('Failed to load gallery:', error);
      galleryStatus.textContent = 'Could not load the gallery. Please try again later.';
      // Make the error message more visible
      galleryStatus.style.color = '#e74c3c';
    }
  }

  // Initial call to load the gallery when the page loads
  loadGallery();

});