const { PDFDocument } = PDFLib;

document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload-pdf-button');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    const documentContainer = document.getElementById('document-container');
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    const clearButton = document.getElementById('clear-button');
    const textInputContainer = document.getElementById('text-input-container');
    const textOverlayInput = document.getElementById('text-overlay');
    const textButton = document.getElementById('process-text-button');
    const imageUploadContainer = document.getElementById('image-upload-container');
    const imageUploadButton = document.getElementById('image-upload');
    const saveButton = document.getElementById('save-button');
    const fontSelector = document.getElementById('font-family-selector');
    const colorBoxes = document.querySelectorAll('.color-box');
    let selectedColor = 'black';
    const mouseColorBox = document.getElementById('mouse-color-box');
    const mouseColor = document.querySelectorAll('.mouse-color');
    let selectedMouseColor = 'black';
    const mouseSignatureField = document.getElementById('mouse-signature-field');
    document.getElementById('add-mouse-signature').addEventListener('click', addMouseSignature);
    document.getElementById('clear-mouse-signature-field').addEventListener('click', clearMouseSignatureField);
    const boldCheckbox = document.querySelector('input[value="bold"]');
    const italicCheckbox = document.querySelector('input[value="italic"]');

    // Initialization PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.js';

    let loadedPdfBytes = null;

    setRadioInputsDisabled(true);
    checkSavedPDF();

    // Check for saved PDF
    function checkSavedPDF() {
        const base64String = localStorage.getItem('savedPDF');
        const fileName = localStorage.getItem('savedFileName') || 'Untitled';

        if (base64String) {
            const byteArray = new Uint8Array(atob(base64String).split('').map(char => char.charCodeAt(0)));
            const file = new Blob([byteArray], {type: 'application/pdf'});
            fileNameDisplay.textContent = `Selected file: ${fileName}`;
            file.arrayBuffer().then(async (arrayBuffer) => {
                loadedPdfBytes = arrayBuffer;
                await renderPDF(loadedPdfBytes);
            });
        }
    }

    // PDF download handler
    uploadButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                fileNameDisplay.textContent = `Selected file: ${file.name}`;
                loadedPdfBytes = await file.arrayBuffer();
                await renderPDF(loadedPdfBytes);
                saveFileToStorage(file);
            }
        };

        input.click();
    });

    // PDF drag and drop handler
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.style.border = '2px dashed #000';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.border = '2px dashed #ccc';
    });

    dropZone.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropZone.style.border = '2px dashed #ccc';

        const file = event.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            fileNameDisplay.textContent = `Selected file: ${file.name}`;
            saveFileToStorage(file);
            loadedPdfBytes = await file.arrayBuffer();
            await renderPDF(loadedPdfBytes);
        } else {
            alert('Please drop a valid PDF file.');
        }
    });

    // PDF rendering function
    async function renderPDF(pdfBytes) {
        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

            documentContainer.innerHTML = '';
            const thumbnailsContainer = document.createElement('div');
            thumbnailsContainer.style.position = 'fixed';
            thumbnailsContainer.style.left = '10px';
            thumbnailsContainer.style.top = '10px';
            thumbnailsContainer.style.width = '140px';
            thumbnailsContainer.style.overflowY = 'auto';
            thumbnailsContainer.style.height = '90vh';
            thumbnailsContainer.style.backgroundColor = '#f4f4f4';
            thumbnailsContainer.style.padding = '10px';
            thumbnailsContainer.style.border = '1px solid #c6c6c6';
            thumbnailsContainer.style.borderRadius = '5px';
            thumbnailsContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            thumbnailsContainer.style.zIndex = '1000';
            thumbnailsContainer.style.boxSizing = 'border-box';

            document.body.appendChild(thumbnailsContainer);

            canvases = [];
            const pagePositions = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                // Thumbnail generation
                const thumbnailWrapper = document.createElement('div');
                thumbnailWrapper.style.marginBottom = '10px';
                thumbnailWrapper.style.textAlign = 'center';

                const thumbnailCanvas = document.createElement('canvas');
                thumbnailCanvas.style.width = '100px';
                thumbnailCanvas.style.cursor = 'pointer';
                thumbnailCanvas.style.border = '1px solid #ccc';
                thumbnailCanvas.style.borderRadius = '3px';

                const page = await pdf.getPage(i);
                const thumbnailViewport = page.getViewport({ scale: 0.2 });

                thumbnailCanvas.width = thumbnailViewport.width;
                thumbnailCanvas.height = thumbnailViewport.height;

                const thumbnailContext = thumbnailCanvas.getContext('2d');
                await page.render({ canvasContext: thumbnailContext, viewport: thumbnailViewport }).promise;

                const pageNumberLabel = document.createElement('div');
                pageNumberLabel.textContent = `Page ${i}`;
                pageNumberLabel.style.fontSize = '12px';
                pageNumberLabel.style.color = '#333';

                thumbnailWrapper.appendChild(thumbnailCanvas);
                thumbnailWrapper.appendChild(pageNumberLabel);
                thumbnailsContainer.appendChild(thumbnailWrapper);

                thumbnailCanvas.addEventListener('click', () => {
                    const targetPosition = pagePositions[i-1];
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });

                });

                const canvasContainer = document.createElement('div');
                canvasContainer.style.position = 'relative';
                canvasContainer.style.margin = '10px';

                const pdfCanvas = document.createElement('canvas');
                const signatureCanvas = document.createElement('canvas');

                let viewport = page.getViewport({ scale: 1 });
                const scale = viewport.width > 1200 ? 1200 / viewport.width : 1;
                viewport = page.getViewport({ scale: scale });

                pdfCanvas.width = viewport.width;
                pdfCanvas.height = viewport.height;
                signatureCanvas.width = viewport.width;
                signatureCanvas.height = viewport.height;

                const pdfContext = pdfCanvas.getContext('2d');
                await page.render({ canvasContext: pdfContext, viewport: viewport }).promise;

                signatureCanvas.style.position = 'absolute';
                signatureCanvas.style.top = '0';
                signatureCanvas.style.left = '0';
                signatureCanvas.style.pointerEvents = 'auto';

                canvasContainer.appendChild(pdfCanvas);
                canvasContainer.appendChild(signatureCanvas);
                documentContainer.appendChild(canvasContainer);

                canvases.push(signatureCanvas);
                pagePositions.push(canvasContainer.offsetTop);

            }

            const updateActiveThumbnail = () => {
                const scrollPosition = window.scrollY + window.innerHeight / 2;
                let activePageIndex = 0;

                for (let j = 0; j < pagePositions.length; j++) {
                    if (
                        scrollPosition >= pagePositions[j] &&
                        (j === pagePositions.length - 1 || scrollPosition < pagePositions[j + 1])
                    ) {
                        activePageIndex = j;
                        break;
                    }
                }

                const thumbnails = thumbnailsContainer.querySelectorAll('canvas');
                thumbnails.forEach((thumb, index) => {
                    thumb.style.border = index === activePageIndex ? '2px solid #007BFF' : '1px solid #ccc';
                });
            };

            // Synchronization of the active thumbnail with scrolling
            const thumbnails = thumbnailsContainer.querySelectorAll('canvas');
            thumbnails[0].style.border = '2px solid #007BFF';

            window.addEventListener('scroll', updateActiveThumbnail);

            setRadioInputsDisabled(false);
        } catch (error) {
            console.error('Error rendering PDF:', error);
        }
    }

    function setRadioInputsDisabled(disabled) {
        radioInputs.forEach((input) => {
            input.disabled = disabled;
        });
    }

    // Save PDF to localStorage
    function saveFileToStorage(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];

            localStorage.setItem('savedPDF', base64String);
            localStorage.setItem('savedFileName', file.name);
            console.log('PDF saved successfully.');
        };
        reader.readAsDataURL(file);
    }

    // Clear all annotations and radio selections
    clearButton.addEventListener('click', () => {
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        location.reload();
    });


    let saveCount = 0; // Savings counter
    let userVoted = localStorage.getItem('userVoted') === 'true';

    // Rate Us button event handler
    document.getElementById('rateUsButton').addEventListener("click", function () {
        const modal = document.getElementById("ratingModal");
        if (modal) {
            modal.style.display = "block";
        }
    });























    // Closing a modal window when clicking outside of it
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("ratingModal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Adding star click handling
    const stars = document.querySelectorAll(".star");

    stars.forEach(star => {
        star.addEventListener("mouseenter", function() {
            const rating = parseInt(this.getAttribute("data-rating"));
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add("hovered");
                }
            });
        });

        star.addEventListener("mouseleave", function() {
            stars.forEach(s => {
                s.classList.remove("hovered");
            });
        });

        star.addEventListener("click", function() {

            localStorage.setItem('userVoted', 'true');

            const rating = this.getAttribute("data-rating");
            document.getElementById("ratingModal").style.display = "none";
            if (rating <= 3) {
                window.open(rate123URL, "https://app.cresotech.com/pdfsigner_rate13.html");
            } else {
                window.open(rate45URL, "https://app.cresotech.com/pdfsigner_rate45.html");
            }
        });
    });

    saveButton.addEventListener('click', async () => {
        if (!loadedPdfBytes) {
            alert('Please upload a PDF first.');
            return;
        }

        const pdfDoc = await PDFDocument.load(loadedPdfBytes);

        for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const pngImageBytes = canvas.toDataURL('image/png').split(',')[1];
            const pngImage = await pdfDoc.embedPng(pngImageBytes);

            const page = pdfDoc.getPage(i);
            const { width, height } = page.getSize();

            page.drawImage(pngImage, {
                x: 0,
                y: height - canvas.height * (width / canvas.width),
                width: width,
                height: height,
            });

            const canvasRect = canvas.getBoundingClientRect();
            const scaleX = width / canvas.width;
            const scaleY = height / canvas.height;

            const annotations = document.querySelectorAll('div[style*="position: absolute"], img');

            for (const annotation of annotations) {
                const annotationRect = annotation.getBoundingClientRect();
                const x = (annotationRect.left - canvasRect.left) * scaleX;
                const y = height - (annotationRect.top - canvasRect.top + annotationRect.height) * scaleY;

                if (annotation.tagName === 'IMG') {
                    try {
                        const originalWidth = annotation.naturalWidth;
                        const originalHeight = annotation.naturalHeight;

                        const annotationWidth = annotation.offsetWidth * scaleX;
                        const annotationHeight = annotation.offsetHeight * scaleY;

                        let finalWidth = annotationWidth;
                        let finalHeight = annotationHeight;

                        const aspectRatio = originalWidth / originalHeight;
                        if (annotationWidth / annotationHeight > aspectRatio) {
                            finalWidth = annotationHeight * aspectRatio;
                        } else {
                            finalHeight = annotationWidth / aspectRatio;
                        }

                        if (annotation.src.startsWith('data:image/png')) {
                            const imgData = annotation.src.split(',')[1];
                            const imgBytes = await pdfDoc.embedPng(imgData);
                            page.drawImage(imgBytes, {
                                x,
                                y: height - (annotationRect.top - canvasRect.top) * scaleY - finalHeight,
                                width: finalWidth,
                                height: finalHeight,
                            });
                        } else {
                            const response = await fetch(annotation.src);
                            const blob = await response.blob();
                            const reader = new FileReader();

                            reader.onloadend = async () => {
                                const imgData = reader.result.split(',')[1];
                                const imgBytes = await pdfDoc.embedPng(imgData);
                                const imgWidth = annotationRect.width * scaleX;
                                const imgHeight = annotationRect.height * scaleY;
                                page.drawImage(imgBytes, {
                                    x,
                                    y: height - (annotationRect.top - canvasRect.top) * scaleY - imgHeight,
                                    width: imgWidth,
                                    height: imgHeight,
                                });
                            };

                            reader.readAsDataURL(blob);
                        }
                    } catch (error) {
                        console.error('Failed to process image:', annotation.src, error);
                    }
                }
            }
        }

        const pdfBytes = await pdfDoc.save({ addDefaultPageThumbnail: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'signed-document.pdf';
        link.click();
        URL.revokeObjectURL(link.href);

        saveCount++;

        if (saveCount % 3 === 0 && !userVoted) {
            showRatingModal();
        }

        const successMessage = document.createElement('div');
        successMessage.textContent = "The document has been saved successfully!";
        successMessage.style.position = "fixed";
        successMessage.style.top = "50%";
        successMessage.style.left = "50%";
        successMessage.style.transform = "translate(-50%, -50%)";
        successMessage.style.padding = "15px 20px";
        successMessage.style.backgroundColor = "green";
        successMessage.style.color = "white";
        successMessage.style.fontSize = "18px";
        successMessage.style.borderRadius = "8px";
        successMessage.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.3)";
        successMessage.style.zIndex = "1000";
        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    });











    // Function to display a modal window
    function showRatingModal() {
        const modal = document.getElementById("ratingModal");
        if (modal) {
            modal.style.display = "block";
        }
    }










    let isDrawingEnabled = false;

    radioInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (input.id === 'mouseCursor') {
                enableMouseDrawing();
                isDrawingEnabled = true;
                imageUploadContainer.style.display = 'none';
                textInputContainer.style.display = 'none';
                mouseColorBox.style.display = 'block';
            } else if (input.id === 'imageOverlay') {
                isDrawingEnabled = false;
                imageUploadContainer.style.display = 'block';
                mouseColorBox.style.display = 'none';
                textInputContainer.style.display = 'none';
            } else if (input.id === 'textOverlay') {
                isDrawingEnabled = false;
                mouseColorBox.style.display = 'none';
                imageUploadContainer.style.display = 'none';
                textInputContainer.style.display = 'block';
            }
        });
    });












    // Setting the selected color for the mouse
    mouseColor.forEach((box) => {
        box.addEventListener('click', () => {
            mouseColor.forEach((b) => b.classList.remove('selected'));
            box.classList.add('selected');
            selectedMouseColor = box.getAttribute('data-color');
        });
    });

    let overlayCanvas = null;
    let overlayContext = null;

    // Creating a transparent layer for drawing
    function createOverlayCanvas() {
        overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = mouseSignatureField.offsetWidth;
        overlayCanvas.height = mouseSignatureField.offsetHeight;
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.style.top = '-0.67rem';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.pointerEvents = 'none';
        overlayCanvas.style.zIndex = '9999';
        overlayCanvas.style.height = '8rem';
        overlayCanvas.style.borderRadius = '10px';
        overlayCanvas.style.backgroundColor = 'white';
        overlayCanvas.style.border = 'none';
        mouseSignatureField.appendChild(overlayCanvas);
        overlayContext = overlayCanvas.getContext('2d');
        overlayContext.strokeStyle = selectedMouseColor;
        overlayContext.lineWidth = 2;
    }

    // Function for processing the "Add signature" button click
    function addMouseSignature() {
        if (overlayCanvas) {
            const imgSrc = overlayCanvas.toDataURL('image/png');
            addImageToDocument(imgSrc);

            mouseSignatureField.removeChild(overlayCanvas);
            overlayCanvas = null;
            overlayContext = null;
        }
    }

    // Function to handle pressing the "Clear" button
    function clearMouseSignatureField() {
        if (overlayCanvas) {
            mouseSignatureField.removeChild(overlayCanvas);
            overlayCanvas = null;
            overlayContext = null;
        }
    }

    // Enabling mouse drawing
    function enableMouseDrawing() {
        let isDrawing = false;

        mouseSignatureField.addEventListener('mousedown', (event) => {
            if (!isDrawingEnabled) return;

            if (!overlayCanvas) {
                createOverlayCanvas();
            }

            isDrawing = true;
            overlayContext.beginPath();
            overlayContext.moveTo(event.offsetX, event.offsetY);
        });

        mouseSignatureField.addEventListener('mousemove', (event) => {
            if (!isDrawing || !overlayContext) return;

            overlayContext.lineTo(event.offsetX, event.offsetY);
            overlayContext.stroke();
        });

        document.addEventListener('mouseup', () => {
            if (!isDrawing) return;

            isDrawing = false;
        });
    }

    imageUploadButton.addEventListener('click', (event) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = "image/*";
        input.style.display = 'none';

        document.body.appendChild(input);
        input.click();

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    addImageToDocument(reader.result);
                };
                reader.readAsDataURL(file);
            }
            document.body.removeChild(input);
        }
    });

    function renderTextAsImage(text, fontFamily, fontSize, color = 'black', backgroundColor = 'transparent', isBold = false, isItalic = false) {

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let fontStyle = '';
        if (isBold) fontStyle += 'bold ';
        if (isItalic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`;

        const textMetrics = ctx.measureText(text);
        const textWidth = Math.ceil(textMetrics.width);
        const ascent = Math.ceil(textMetrics.actualBoundingBoxAscent || fontSize * 0.8);
        const descent = Math.ceil(textMetrics.actualBoundingBoxDescent || fontSize * 0.2);
        const textHeight = ascent + descent;

        const padding = Math.ceil(fontSize * 0.2);
        const totalWidth = textWidth + padding * 2;
        const totalHeight = textHeight + padding * 2;

        const scale = window.devicePixelRatio || 1;
        canvas.width = totalWidth * scale;
        canvas.height = totalHeight * scale;
        canvas.style.width = `${totalWidth}px`;
        canvas.style.height = `${totalHeight}px`;

        ctx.scale(scale, scale);

        ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`;
        ctx.textBaseline = 'alphabetic';

        if (backgroundColor !== 'transparent') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
        }

        ctx.fillStyle = color;
        ctx.fillText(text, padding, padding + ascent);

        return canvas;
    }

    // Setting the selected color
    colorBoxes.forEach((box) => {
        box.addEventListener('click', () => {
            colorBoxes.forEach((b) => b.classList.remove('selected'));

            box.classList.add('selected');
            selectedColor = box.getAttribute('data-color');
        });
    });

    fontSelector.addEventListener('change', (event) => {
        const selectedFont = event.target.value;
        fontSelector.style.fontFamily = selectedFont;
    });

    // Processing a text button
    textButton.addEventListener('click', (event) => {
        const text = textOverlayInput.value;
        const fontFamily = fontSelector.value || 'Arial';
        const fontSize = 40;
        const bgColor = 'transparent';

        const isBold = boldCheckbox.checked;
        const isItalic = italicCheckbox.checked;

        if (!text) {
            alert("Please enter some text.");
            return;
        }

        const textCanvas = renderTextAsImage(text, fontFamily, fontSize, selectedColor, bgColor, isBold, isItalic);
        const textImageSrc = textCanvas.toDataURL('image/png');

        addImageToDocument(textImageSrc);
    });

    function addImageToDocument(imgSrc, isDraggable = true) {
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'absolute';
        imgContainer.style.display = 'inline-block';
        imgContainer.style.border = '1px dashed gray';
        imgContainer.style.width = '200px';
        imgContainer.style.height = '200px';
        imgContainer.style.cursor = 'move';
        // imgContainer.style.overflow = 'hidden';
        imgContainer.style.boxSizing = 'border-box';

        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.pointerEvents = 'none';

        const resizeHandle = document.createElement('div');
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.width = '10px';
        resizeHandle.style.height = '10px';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.cursor = 'nwse-resize';
        resizeHandle.style.background = '#007BFF';

        let isDragging = false;
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        let aspectRatio = 1;
        let isInitialized = false;

        img.onload = () => {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            aspectRatio = naturalWidth / naturalHeight;

            const maxWidth = window.innerWidth * 0.3;
            const maxHeight = window.innerHeight * 0.3;

            let newWidth = Math.min(naturalWidth, maxWidth);
            let newHeight = newWidth / aspectRatio;

            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = newHeight * aspectRatio;
            }

            imgContainer.style.width = `${newWidth}px`;
            imgContainer.style.height = `${newHeight}px`;

            isInitialized = true;
        };

        // Dragging
        if (isDraggable) {
            imgContainer.addEventListener('mousedown', (e) => {
                if (e.target !== resizeHandle && e.button === 0) {
                    isDragging = true;
                    startX = e.clientX - imgContainer.getBoundingClientRect().left;
                    startY = e.clientY - imgContainer.getBoundingClientRect().top;
                    imgContainer.style.cursor = 'grabbing';
                    e.preventDefault();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    const newX = e.clientX - startX + window.scrollX;
                    const newY = e.clientY - startY + window.scrollY;
                    imgContainer.style.left = `${newX}px`;
                    imgContainer.style.top = `${newY}px`;
                }
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    imgContainer.style.cursor = 'move';
                }
            });
        }

        // Resize
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = imgContainer.offsetWidth;
            startHeight = imgContainer.offsetHeight;
            e.stopPropagation();
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                e.preventDefault();
                const deltaX = e.clientX - startX;
                let newWidth = startWidth + deltaX;
                let newHeight = newWidth / aspectRatio;

                if (isInitialized) {
                    imgContainer.style.width = `${newWidth}px`;
                    imgContainer.style.height = `${newHeight}px`;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
            }
        });


        // Adding a button to exclude an item
        const closeButton = document.createElement('button');
        closeButton.innerText = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '-10px';
        closeButton.style.right = '5px';
        closeButton.style.background = 'white';
        closeButton.style.color = 'black';
        closeButton.style.border = '1px solid black';
        closeButton.style.borderRadius = '50%';
        closeButton.style.width = '20px';
        closeButton.style.height = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.fontSize = '17px';
        closeButton.style.padding = '0';

        closeButton.addEventListener('click', () => {
            imgContainer.remove();
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(closeButton);
        imgContainer.appendChild(resizeHandle);
        document.body.appendChild(imgContainer);

        // Location in the center of the visible area
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        imgContainer.style.left = `${scrollX + (viewportWidth - imgContainer.offsetWidth) / 2}px`;
        imgContainer.style.top = `${scrollY + (viewportHeight - imgContainer.offsetHeight) / 2}px`;
    }

});
