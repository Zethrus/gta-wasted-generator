document.addEventListener('DOMContentLoaded', () => {
  const galleryGrid = document.getElementById('gallery-grid');
  const loadingMessage = document.getElementById('loading-message');
  const galleryStatus = document.getElementById('gallery-status');

  /**
   * Fetches images from the server and populates the gallery.
   */
  async function loadGallery() {
    try {
      const response = await fetch('/gallery-images');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const images = await response.json();

      galleryGrid.innerHTML = '';

      if (images.length === 0) {
        galleryStatus.textContent = 'The gallery is empty. Be the first to add a public image!';
      } else {
        galleryStatus.style.display = 'none';

        images.forEach(image => {
          const link = document.createElement('a');
          link.href = `/gallery/${image.id}`;

          // Create a wrapper for the image and its info
          const imageCard = document.createElement('div');
          imageCard.className = 'gallery-card';

          const imgElement = document.createElement('img');
          imgElement.src = image.path;
          imgElement.alt = 'A user-generated image with the Wasted banner.';
          imgElement.title = `Created: ${new Date(image.createdAt).toLocaleString()}`;

          // --- NEW: Create stats container for likes ---
          const statsContainer = document.createElement('div');
          statsContainer.className = 'gallery-stats';

          const likeButton = document.createElement('button');
          likeButton.className = 'like-btn';
          likeButton.innerHTML = '❤️'; // Simple heart emoji for the button

          const likeCount = document.createElement('span');
          likeCount.className = 'like-count';
          likeCount.textContent = image.likes;

          statsContainer.appendChild(likeButton);
          statsContainer.appendChild(likeCount);

          // --- NEW: Add like button functionality ---
          likeButton.addEventListener('click', async () => {
            try {
              const likeResponse = await fetch(`/api/gallery/${image.id}/like`, { method: 'POST' });
              if (!likeResponse.ok) throw new Error('Failed to submit like.');

              // Increment count on the frontend and disable button
              likeCount.textContent = parseInt(likeCount.textContent) + 1;
              likeButton.disabled = true;
              likeButton.classList.add('liked');

            } catch (error) {
              console.error('Error liking image:', error);
            }
          });

          // Append elements to the card, and card to the grid
          imageCard.appendChild(imgElement);
          imageCard.appendChild(statsContainer);

          link.appendChild(imageCard);
          galleryGrid.appendChild(link);
        });
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
      galleryStatus.textContent = 'Could not load the gallery. Please try again later.';
      galleryStatus.style.color = '#e74c3c';
    }
  }

  loadGallery();
});