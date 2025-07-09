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
  const finalizeBtn = document.getElementById('finalize-btn');
  const cancelBtn = document.getElementById('cancel-btn');

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

  // --- NEW: Custom Error Modal Logic ---
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
    uploadError.textContent = ''; // Clear previous errors

    if (!file) return;

    // Validation 1: File Type
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      uploadError.textContent = 'Invalid file type. Please use JPEG or PNG.';
      return;
    }

    // Validation 2: File Size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      uploadError.textContent = 'File is too large. Maximum size is 5MB.';
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      showView(editorBox); // Assuming showView is defined elsewhere
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
    // Calculate mouse Y position relative to the container, from 0 to container height
    let newY = e.clientY - containerRect.top;

    // Constrain the banner within the container
    const bannerHeight = draggableBanner.offsetHeight;
    if (newY < 0) newY = 0;
    if (newY > containerRect.height - bannerHeight) newY = containerRect.height - bannerHeight;

    draggableBanner.style.top = `${newY}px`;
    draggableBanner.style.transform = 'translateY(0)'; // Override centered transform
  });

  cancelBtn.addEventListener('click', () => showView(uploadBox));

  // --- Finalize and Generate ---
  finalizeBtn.addEventListener('click', () => {
    if (!currentFile) return;

    const formData = new FormData();
    // ... (append form data logic remains the same)
    const isPublicCheckbox = document.getElementById('make-public-checkbox');
    const bannerTop = draggableBanner.offsetTop;
    const containerHeight = previewContainer.offsetHeight;
    const bannerTopPercent = (bannerTop / containerHeight) * 100;
    formData.append('image', currentFile);
    formData.append('bannerTopPercent', bannerTopPercent);
    formData.append('isPublic', isPublicCheckbox.checked);

    loadingOverlay.style.display = 'flex';

    fetch('/generate', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          // If server responds with an error status (4xx, 5xx)
          throw new Error(`Server error: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          resultImage.src = data.filePath;
          downloadBtn.href = data.filePath;
          showView(resultBox);
        } else {
          // If server responds with success:false
          throw new Error('Image processing failed on the server.');
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
});