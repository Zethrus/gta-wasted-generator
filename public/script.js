document.addEventListener('DOMContentLoaded', () => {
  // Views
  const uploadBox = document.getElementById('upload-box');
  const editorBox = document.getElementById('editor-box');
  const resultBox = document.getElementById('result-box');

  // Upload elements
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');

  // Editor elements
  const previewContainer = document.getElementById('image-preview-container');
  const previewImage = document.getElementById('preview-image');
  const draggableBanner = document.getElementById('draggable-banner');
  const finalizeBtn = document.getElementById('finalize-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  // Result elements
  const resultImage = document.getElementById('result-image');
  const downloadBtn = document.getElementById('download-btn');
  const uploadNewBtn = document.getElementById('upload-new-btn');

  // Subtitle text
  const subtitle = document.getElementById('subtitle');

  let currentFile = null;

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
    if (file && file.type.startsWith('image/')) {
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        showView(editorBox);
      };
      reader.readAsDataURL(file);
    }
  };

  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  dropArea.addEventListener('dragover', (e) => e.preventDefault());
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
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

    // Find the new checkbox
    const isPublicCheckbox = document.getElementById('make-public-checkbox');

    const bannerTop = draggableBanner.offsetTop;
    const containerHeight = previewContainer.offsetHeight;
    const bannerTopPercent = (bannerTop / containerHeight) * 100;

    const formData = new FormData();
    formData.append('image', currentFile);
    formData.append('bannerTopPercent', bannerTopPercent);
    // ✅ This line correctly appends the checkbox value
    formData.append('isPublic', isPublicCheckbox.checked);

    subtitle.textContent = "Generating your image...";
    finalizeBtn.disabled = true;
    finalizeBtn.textContent = "Processing...";

    fetch('/generate', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          resultImage.src = data.filePath;
          downloadBtn.href = data.filePath;
          showView(resultBox);
        } else {
          alert('Image processing failed!');
          showView(editorBox);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during generation.');
        showView(editorBox);
      })
      .finally(() => {
        finalizeBtn.disabled = false;
        finalizeBtn.textContent = "Finalize Image";
      });
  });


  // --- Result Logic ---
  uploadNewBtn.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = '';
    showView(uploadBox);
  });
});