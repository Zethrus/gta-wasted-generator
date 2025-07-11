document.addEventListener('DOMContentLoaded', () => {

  // Views
  const uploadBox = document.getElementById('upload-box');
  const editorBox = document.getElementById('editor-box');
  const resultBox = document.getElementById('result-box');

  // Elements
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');
  const loadingOverlay = document.getElementById('loading-overlay');
  const uploadError = document.getElementById('upload-error');
  const subtitle = document.getElementById('subtitle');

  // Editor elements
  const previewImage = document.getElementById('preview-image');
  const draggableBanner = document.getElementById('draggable-banner');
  const previewContainer = document.getElementById('image-preview-container');
  const sizeSlider = document.getElementById('size-slider'); // Get the new slider
  const finalizeBtn = document.getElementById('finalize-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const copyLinkBtn = document.getElementById('copy-link-btn');
  const shareTwitterBtn = document.getElementById('share-twitter-btn');
  const shareFacebookBtn = document.getElementById('share-facebook-btn');
  const shareRedditBtn = document.getElementById('share-reddit-btn');

  // Result elements
  const resultImage = document.getElementById('result-image');
  const downloadBtn = document.getElementById('download-btn');
  const uploadNewBtn = document.getElementById('upload-new-btn');

  // Modal elements
  const errorModal = document.getElementById('error-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  let currentFile = null;

  // --- Custom Error Modal Logic ---
  const showErrorModal = (title, message) => {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    errorModal.style.display = 'flex';
  };

  modalCloseBtn.addEventListener('click', () => {
    errorModal.style.display = 'none';
  });

  // --- Page state management ---
  const showView = (view) => {
    [uploadBox, editorBox, resultBox].forEach(v => v.style.display = 'none');
    view.style.display = 'block';

    if (view === editorBox) {
      subtitle.textContent = 'Adjust the banner position before finalizing.';
    } else if (view === resultBox) {
      subtitle.textContent = 'Your image is ready!';
    } else {
      subtitle.textContent = 'Upload your photo and get the iconic "Wasted" effect from Grand Theft Auto';
    }
  };

  // --- File Handling ---
  const handleFile = (file) => {
    uploadError.textContent = '';

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      uploadError.textContent = 'Invalid file type. Please use JPEG or PNG.';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      uploadError.textContent = 'File is too large. Maximum size is 10MB.';
      return;
    }

    // Reset banner and slider to default state when a new file is loaded
    draggableBanner.style.width = '80%';
    draggableBanner.style.left = '10%';
    draggableBanner.style.top = '50%';
    draggableBanner.style.transform = 'translateY(-50%)';
    if (sizeSlider) {
      sizeSlider.value = 80;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      showView(editorBox);
    };
    reader.readAsDataURL(file);
  };

  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  dropArea.addEventListener('dragover', (e) => e.preventDefault());
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('is-dragging');
    handleFile(e.dataTransfer.files[0]);
  });

  // --- Active Drag State Logic ---
  dropArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('is-dragging');
  });

  dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('is-dragging');
  });

  // --- Editor Logic ---
  let isDragging = false;
  draggableBanner.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
  });

  document.addEventListener('mouseup', () => isDragging = false);
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const containerRect = previewContainer.getBoundingClientRect();
    let newY = e.clientY - containerRect.top;

    const bannerHeight = draggableBanner.offsetHeight;
    if (newY < 0) newY = 0;
    if (newY > containerRect.height - bannerHeight) newY = containerRect.height - bannerHeight;

    draggableBanner.style.top = `${newY}px`;
    draggableBanner.style.transform = 'translateY(0)';
  });

  // --- NEW: Slider Logic ---
  if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
      const newWidth = e.target.value;
      draggableBanner.style.width = `${newWidth}%`;
      draggableBanner.style.left = `${(100 - newWidth) / 2}%`;
    });
  }

  cancelBtn.addEventListener('click', () => showView(uploadBox));

  // --- Finalize and Generate ---
  finalizeBtn.addEventListener('click', () => {
    if (!currentFile) return;

    const formData = new FormData();
    const isPublicCheckbox = document.getElementById('make-public-checkbox');
    const bannerTop = draggableBanner.offsetTop;
    const containerHeight = previewContainer.offsetHeight;
    const bannerTopPercent = (bannerTop / containerHeight) * 100;

    formData.append('image', currentFile);
    formData.append('bannerTopPercent', bannerTopPercent);
    formData.append('isPublic', isPublicCheckbox.checked);
    // Append the banner width from the slider
    if (sizeSlider) {
      formData.append('bannerWidthPercent', sizeSlider.value);
    }

    loadingOverlay.style.display = 'flex';

    fetch('/generate', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          resultImage.src = data.filePath;
          downloadBtn.href = data.filePath;
          // Set social share links with the new final image path
          const finalUrl = new URL(data.filePath, window.location.href).href;
          copyLinkBtn.setAttribute('data-url', finalUrl);
          shareTwitterBtn.setAttribute('data-url', finalUrl);
          shareFacebookBtn.setAttribute('data-url', finalUrl);
          shareRedditBtn.setAttribute('data-url', finalUrl);
          showView(resultBox);
        } else {
          throw new Error(data.message || 'Image processing failed on the server.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showErrorModal('Generation Failed', error.message);
      })
      .finally(() => {
        loadingOverlay.style.display = 'none';
      });
  });


  // --- Result Logic ---
  uploadNewBtn.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = '';
    showView(uploadBox);
  });

  // --- Copy Link Logic ---
  copyLinkBtn.addEventListener('click', (e) => {
    const imageUrl = e.currentTarget.getAttribute('data-url');
    navigator.clipboard.writeText(imageUrl).then(() => {
      const originalText = copyLinkBtn.textContent;
      copyLinkBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyLinkBtn.textContent = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      showErrorModal('Copy Failed', 'Could not copy link to clipboard.');
    });
  });

  // --- Social Sharing Logic ---
  const shareUrl = (shareServiceUrl, imageUrl) => {
    const text = encodeURIComponent("Check out this image I made with the GTA Wasted Generator!");
    const fullUrl = shareServiceUrl + `&text=${text}&url=${encodeURIComponent(imageUrl)}`;
    window.open(fullUrl, '_blank', 'width=600,height=400');
  };

  shareTwitterBtn.addEventListener('click', (e) => {
    const imageUrl = e.currentTarget.getAttribute('data-url');
    shareUrl('https://twitter.com/intent/tweet?', imageUrl);
  });

  shareFacebookBtn.addEventListener('click', (e) => {
    const imageUrl = e.currentTarget.getAttribute('data-url');
    const fullUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`;
    window.open(fullUrl, '_blank', 'width=600,height=400');
  });

  shareRedditBtn.addEventListener('click', (e) => {
    const imageUrl = e.currentTarget.getAttribute('data-url');
    const title = encodeURIComponent("GTA Wasted Generator");
    const fullUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(imageUrl)}&title=${title}`;
    window.open(fullUrl, '_blank', 'width=600,height=400');
  });
});