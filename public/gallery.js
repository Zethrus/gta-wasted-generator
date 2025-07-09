document.addEventListener('DOMContentLoaded', () => {

  const galleryGrid = document.getElementById('gallery-grid');
  const galleryStatus = document.getElementById('gallery-status');

  // --- NEW: Helper functions for managing liked images in localStorage ---
  const getLikedImages = () => {
    const liked = localStorage.getItem('likedImages');
    return liked ? JSON.parse(liked) : [];
  };

  const addLikedImage = (id) => {
    const liked = getLikedImages();
    if (!liked.includes(id)) {
      liked.push(id);
      localStorage.setItem('likedImages', JSON.stringify(liked));
    }
  };

  async function loadGallery() {
    try {
      const response = await fetch('/gallery-images');
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

      const images = await response.json();
      const likedImages = getLikedImages(); // <-- Get liked images on load

      galleryGrid.innerHTML = '';

      if (images.length === 0) {
        galleryStatus.textContent = 'The gallery is empty. Be the first to add a public image!';
      } else {
        galleryStatus.style.display = 'none';

        images.forEach(image => {
          const link = document.createElement('a');
          link.href = `/gallery/${image.id}`;

          const imageCard = document.createElement('div');
          imageCard.className = 'gallery-card';

          const imgElement = document.createElement('img');
          imgElement.src = image.path;
          imgElement.alt = 'A user-generated image with the Wasted banner.';
          imgElement.title = `Created: ${new Date(image.createdAt).toLocaleString()}`;

          const statsContainer = document.createElement('div');
          statsContainer.className = 'gallery-stats';

          const likeButton = document.createElement('button');
          likeButton.className = 'like-btn';
          likeButton.innerHTML = '❤️';

          const likeCount = document.createElement('span');
          likeCount.className = 'like-count';
          likeCount.textContent = image.likes;

          // --- NEW: Check if image is already liked ---
          if (likedImages.includes(image.id)) {
            likeButton.disabled = true;
            likeButton.classList.add('liked');
          }

          statsContainer.appendChild(likeButton);
          statsContainer.appendChild(likeCount);

          likeButton.addEventListener('click', async (e) => {
            e.preventDefault(); // <-- Prevent link navigation when liking
            e.stopPropagation();

            if (likeButton.disabled) return;

            try {
              await fetch(`/api/gallery/${image.id}/like`, { method: 'POST' });
              likeCount.textContent = parseInt(likeCount.textContent) + 1;
              addLikedImage(image.id); // <-- Save the liked state
              likeButton.disabled = true;
              likeButton.classList.add('liked');
            } catch (error) {
              console.error('Error liking image:', error);
            }
          });

          imageCard.appendChild(imgElement);
          imageCard.appendChild(statsContainer);
          link.appendChild(imageCard);
          galleryGrid.appendChild(link);
        });
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
      galleryStatus.textContent = 'Could not load the gallery. Please try again later.';
    }
  }

  loadGallery();
});