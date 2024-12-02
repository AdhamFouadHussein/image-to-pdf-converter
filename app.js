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
    if (files.length === 0) return;
    
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
        };
        reader.readAsDataURL(file);
    });

    // Clear the file input to allow selecting the same files again
    fileInput.value = '';
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

convertButton.addEventListener('click', async () => {
    if (!hasImages) return;

    loadingDiv.style.display = 'block';
    convertButton.disabled = true;

    try {
        const pdf = new window.jspdf.jsPDF();
        const images = imageContainer.getElementsByTagName('img');
        
        for (let i = 0; i < images.length; i++) {
            if (i > 0) pdf.addPage();
            
            const canvas = await html2canvas(images[i]);
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save('converted-images.pdf');
    } catch (error) {
        console.error('Conversion failed:', error);
        alert('Failed to convert images to PDF. Please try again.');
    }

    loadingDiv.style.display = 'none';
    convertButton.disabled = false;
});
