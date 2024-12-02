const themeToggle = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Initialize theme
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Add system theme change listener
prefersDarkScheme.addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

const imageContainer = document.getElementById('image-container');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const convertButton = document.getElementById('convert-button');
const loadingDiv = document.querySelector('.loading');

let hasImages = false;

uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', handleFileSelect);
imageContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageContainer.style.borderColor = '#4CAF50';
});

imageContainer.addEventListener('dragleave', () => {
    imageContainer.style.borderColor = '#ccc';
});

imageContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    imageContainer.style.borderColor = '#ccc';
    handleFiles(e.dataTransfer.files);
});

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    if (files.length === 0) {
        dropIndicator.style.display = 'none';
        return;
    }
    
    // Remove the initial placeholder text if it exists
    const placeholder = imageContainer.querySelector('p');
    if (placeholder) {
        imageContainer.innerHTML = '';
    }

    hasImages = true;
    convertButton.disabled = false;

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.draggable = true;

            const img = document.createElement('img');
            img.src = e.target.result;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                wrapper.remove();
                if (imageContainer.getElementsByClassName('image-wrapper').length === 0) {
                    hasImages = false;
                    convertButton.disabled = true;
                    // Restore placeholder when all images are removed
                    imageContainer.innerHTML = '<p style="text-align: center; color: #666;">Drop images here or click upload button</p>';
                }
            };

            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);
            imageContainer.appendChild(wrapper);

            // Add drag events
            wrapper.addEventListener('dragstart', handleDragStart);
            wrapper.addEventListener('dragend', handleDragEnd);
            wrapper.addEventListener('dragover', handleDragOver);
            wrapper.addEventListener('drop', handleDrop);

            // Add touch events for mobile
            wrapper.addEventListener('touchstart', handleTouchStart);
            wrapper.addEventListener('touchmove', handleTouchMove);
            wrapper.addEventListener('touchend', handleTouchEnd);
        };
        reader.readAsDataURL(file);
    });

    // Clear the file input to allow selecting the same files again
    fileInput.value = '';
}

function isMobile() {
    return window.matchMedia('(max-width: 600px)').matches;
}

function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', Array.from(e.target.parentNode.children).indexOf(e.target));
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.image-wrapper').forEach(wrapper => {
        wrapper.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.closest('.image-wrapper')?.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
    const dropZone = e.target.closest('.image-wrapper');
    
    if (dropZone) {
        const dropIdx = Array.from(imageContainer.children).indexOf(dropZone);
        const draggedElement = imageContainer.children[draggedIdx];
        
        if (draggedIdx < dropIdx) {
            dropZone.parentNode.insertBefore(draggedElement, dropZone.nextSibling);
        } else {
            dropZone.parentNode.insertBefore(draggedElement, dropZone);
        }
    }
    
    handleDragEnd(e);
}

let dropIndicator = document.createElement('div');
dropIndicator.className = 'drop-indicator';
dropIndicator.style.display = 'none';
document.body.appendChild(dropIndicator);

function handleTouchStart(e) {
    // Ignore if touching delete button
    if (e.target.classList.contains('delete-btn')) {
        return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    this.style.position = 'absolute';
    this.style.zIndex = 1000;
    this.style.transform = 'scale(0.8)';
    this.style.left = `${touch.pageX - this.offsetWidth / 2}px`;
    this.style.top = `${touch.pageY - this.offsetHeight / 2}px`;
    this.classList.add('dragging');
    imageContainer.classList.add('image-container-dragging'); // Increase container height
}

function handleTouchMove(e) {
    if (e.target.classList.contains('delete-btn') || !isMobile()) {
        return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = imageContainer.getBoundingClientRect();
    const newLeft = Math.max(containerRect.left, Math.min(touch.pageX - this.offsetWidth / 2, containerRect.right - this.offsetWidth));
    const newTop = Math.max(containerRect.top, Math.min(touch.pageY - this.offsetHeight / 2, containerRect.bottom - this.offsetHeight));
    this.style.left = `${newLeft}px`;
    this.style.top = `${newTop}px`;

    // Check if there are any images besides the dragged one
    const imageWrappers = imageContainer.getElementsByClassName('image-wrapper');
    if (imageWrappers.length <= 1) {
        dropIndicator.style.display = 'none';
        return;
    }

    // Only show indicator on touch devices
    if (!isMobile()) {
        dropIndicator.style.display = 'none';
        return;
    }

    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementAtPoint?.closest('.image-wrapper');
    
    if (dropZone && dropZone !== this) {
        const dropRect = dropZone.getBoundingClientRect();
        const touchY = touch.clientY;
        
        // Show indicator above or below based on touch position relative to dropZone center
        if (touchY < dropRect.top + (dropRect.height / 2)) {
            dropIndicator.style.top = `${dropRect.top}px`;
        } else {
            dropIndicator.style.top = `${dropRect.bottom}px`;
        }
        
        dropIndicator.style.left = `${dropRect.left}px`;
        dropIndicator.style.width = `${dropRect.width}px`;
        dropIndicator.style.display = 'block';
    } else {
        dropIndicator.style.display = 'none';
    }
}

function handleTouchEnd(e) {
    // Don't handle end if initial touch was on delete button
    if (e.target.classList.contains('delete-btn')) {
        return;
    }
    
    e.preventDefault();
    this.classList.remove('dragging');
    this.style.transform = '';
    imageContainer.classList.remove('image-container-dragging');
    dropIndicator.style.display = 'none';

    const elementAtPoint = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    const dropZone = elementAtPoint?.closest('.image-wrapper');
    
    if (dropZone && dropZone !== this) {
        const touchY = e.changedTouches[0].clientY;
        const dropRect = dropZone.getBoundingClientRect();
        
        if (touchY < dropRect.top + (dropRect.height / 2)) {
            // Insert before if touch is in the upper half
            dropZone.parentNode.insertBefore(this, dropZone);
        } else {
            // Insert after if touch is in the lower half
            dropZone.parentNode.insertBefore(this, dropZone.nextSibling);
        }
    }

    this.style.position = '';
    this.style.zIndex = '';
    this.style.left = '';
    this.style.top = '';
}

convertButton.addEventListener('click', async () => {
    if (!hasImages) return;

    loadingDiv.style.display = 'block';
    convertButton.disabled = true;

    try {
        const images = imageContainer.getElementsByTagName('img');
        const pdf = new window.jspdf.jsPDF();
        
        for (let i = 0; i < images.length; i++) {
            if (i > 0) {
                pdf.addPage();
            }

            // Create temporary container for each image
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            document.body.appendChild(tempContainer);
            
            const imgClone = images[i].cloneNode(true);
            tempContainer.appendChild(imgClone);
            
            const canvas = await html2canvas(tempContainer, {
                logging: false,
                useCORS: true,
                allowTaint: true,
                scale: 2
            });
            
            document.body.removeChild(tempContainer);
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            
            let finalWidth = pageWidth;
            let finalHeight = (imgHeight * pageWidth) / imgWidth;
            
            if (finalHeight > pageHeight) {
                finalHeight = pageHeight;
                finalWidth = (imgWidth * pageHeight) / imgHeight;
            }
            
            const xOffset = (pageWidth - finalWidth) / 2;
            const yOffset = (pageHeight - finalHeight) / 2;
            
            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
        }
        
        pdf.save('converted-images.pdf');
    } catch (error) {
        console.error('Conversion failed:', error);
        alert('Failed to convert images to PDF. Please try again.');
    }

    loadingDiv.style.display = 'none';
    convertButton.disabled = false;
});
