let uploadedImages = []

// DOM Elements
const imageInput = document.getElementById('imageInput')
const uploadArea = document.getElementById('uploadArea')
const splitButton = document.getElementById('splitButton')
const imagesContainer = document.getElementById('imagesContainer')
const imageCount = document.getElementById('imageCount')
const gridInfo = document.getElementById('gridInfo')
const totalParts = document.getElementById('totalParts')

// Initialize event listeners
function initializeEventListeners() {
	// File input change event
	imageInput.addEventListener('change', handleFileSelect)
	
	// Prevent file input click from bubbling to avoid double-triggering
	imageInput.addEventListener('click', (e) => {
		e.stopPropagation()
	})
	
	// Drag and drop events
	uploadArea.addEventListener('dragover', handleDragOver)
	uploadArea.addEventListener('dragleave', handleDragLeave)
	uploadArea.addEventListener('drop', handleDrop)
	uploadArea.addEventListener('click', handleUploadAreaClick)
	
	// Input validation
	document.getElementById('columns').addEventListener('input', validateInputs)
	document.getElementById('rows').addEventListener('input', validateInputs)
	
	// Custom arrow buttons
	initializeCustomArrows()
}

// Initialize custom arrow functionality
function initializeCustomArrows() {
	const arrowButtons = document.querySelectorAll('.arrow-btn')
	
	arrowButtons.forEach(button => {
		button.addEventListener('click', handleArrowClick)
		
		// Add long press functionality
		let longPressTimer
		let isLongPress = false
		
		button.addEventListener('mousedown', () => {
			isLongPress = false
			longPressTimer = setTimeout(() => {
				isLongPress = true
				startContinuousIncrement(button)
			}, 500) // Start continuous after 500ms
		})
		
		button.addEventListener('mouseup', () => {
			clearTimeout(longPressTimer)
			stopContinuousIncrement()
		})
		
		button.addEventListener('mouseleave', () => {
			clearTimeout(longPressTimer)
			stopContinuousIncrement()
		})
	})
}

let continuousIncrementInterval
function startContinuousIncrement(button) {
	continuousIncrementInterval = setInterval(() => {
		handleArrowClick({ target: button })
	}, 100) // Increment every 100ms during long press
}

function stopContinuousIncrement() {
	if (continuousIncrementInterval) {
		clearInterval(continuousIncrementInterval)
		continuousIncrementInterval = null
	}
}

// Handle arrow button clicks
function handleArrowClick(e) {
	const button = e.target.closest('.arrow-btn')
	const targetInputId = button.getAttribute('data-target')
	const isUpArrow = button.classList.contains('arrow-up')
	const input = document.getElementById(targetInputId)
	
	if (!input) return
	
	const currentValue = parseInt(input.value) || 0
	const min = parseInt(input.getAttribute('min')) || 1
	const max = parseInt(input.getAttribute('max')) || 20
	
	let newValue
	if (isUpArrow) {
		newValue = Math.min(currentValue + 1, max)
	} else {
		newValue = Math.max(currentValue - 1, min)
	}
	
	if (newValue !== currentValue) {
		input.value = newValue
		// Trigger input event to update validation and info panel
		input.dispatchEvent(new Event('input', { bubbles: true }))
		
		// Add visual feedback
		button.style.transform = 'scale(0.9)'
		setTimeout(() => {
			button.style.transform = ''
		}, 100)
	}
}

// Drag and drop handlers
function handleDragOver(e) {
	e.preventDefault()
	uploadArea.classList.add('dragover')
}

function handleDragLeave(e) {
	e.preventDefault()
	uploadArea.classList.remove('dragover')
}

function handleDrop(e) {
	e.preventDefault()
	uploadArea.classList.remove('dragover')
	
	const files = e.dataTransfer.files
	handleFiles(files)
}

// Handle upload area click
function handleUploadAreaClick(e) {
	// Only trigger file input if the click didn't come from the hidden file input itself
	if (e.target !== imageInput) {
		imageInput.click()
	}
}

// File selection handler
function handleFileSelect(e) {
	const files = e.target.files
	handleFiles(files)
}

// Handle files (from input or drag-drop)
function handleFiles(files) {
	if (files.length === 0) return
	
	uploadedImages = []
	imagesContainer.innerHTML = ''
	
	// Show processing feedback
	showToast('Loading images...', 'info')
	toggleLoader(true)
	
	// Validate file types
	const validFiles = Array.from(files).filter(file => {
		if (!file.type.startsWith('image/')) {
			showToast(`${file.name} is not a valid image file`, 'error')
			return false
		}
		return true
	})
	
	if (validFiles.length === 0) {
		toggleLoader(false)
		return
	}
	
	// Process files
	let imagesLoaded = 0
	validFiles.forEach(file => {
		const reader = new FileReader()
		reader.onload = function (event) {
			const img = new Image()
			img.onload = function () {
				uploadedImages.push({
					element: img,
					name: file.name,
					size: file.size
				})
				displayImage(img, uploadedImages.length - 1, file.name, file.size)
				
				imagesLoaded++
				if (imagesLoaded === validFiles.length) {
					toggleLoader(false)
					splitButton.disabled = false
					updateInfoPanel()
					showToast(`${validFiles.length} image(s) loaded successfully`, 'success')
				}
			}
			img.onerror = function() {
				showToast(`Failed to load ${file.name}`, 'error')
				imagesLoaded++
				if (imagesLoaded === validFiles.length) {
					toggleLoader(false)
				}
			}
			img.src = event.target.result
		}
		reader.onerror = function() {
			showToast(`Failed to read ${file.name}`, 'error')
		}
		reader.readAsDataURL(file)
	})
}

// Display image with enhanced info
function displayImage(img, index, fileName, fileSize) {
	const imageContainer = document.createElement('div')
	imageContainer.classList.add('image-container')
	
	// Image info section
	const imageInfo = document.createElement('div')
	imageInfo.classList.add('image-info')
	
	const fileName_span = document.createElement('span')
	fileName_span.textContent = fileName
	
	const fileDetails = document.createElement('span')
	fileDetails.textContent = `${img.width}×${img.height} • ${formatFileSize(fileSize)}`
	
	imageInfo.appendChild(fileName_span)
	imageInfo.appendChild(fileDetails)
	
	// Image content container (side-by-side layout)
	const imageContent = document.createElement('div')
	imageContent.classList.add('image-content')
	
	// Preview section (left side)
	const previewSection = document.createElement('div')
	previewSection.classList.add('image-preview-section')
	
	const preview = document.createElement('img')
	preview.src = img.src
	preview.classList.add('preview')
	
	previewSection.appendChild(preview)
	
	// Splits section (right side)
	const splitsSection = document.createElement('div')
	splitsSection.classList.add('image-splits-section')
	
	const splitImagesGrid = document.createElement('div')
	splitImagesGrid.classList.add('split-images-grid')
	splitImagesGrid.id = `splitImages-${index}`
	
	splitsSection.appendChild(splitImagesGrid)
	
	// Assemble the structure
	imageContent.appendChild(previewSection)
	imageContent.appendChild(splitsSection)
	
	imageContainer.appendChild(imageInfo)
	imageContainer.appendChild(imageContent)
	imagesContainer.appendChild(imageContainer)
}

// Validate inputs and update button state
function validateInputs() {
	const columns = parseInt(document.getElementById('columns').value)
	const rows = parseInt(document.getElementById('rows').value)
	
	const isValid = columns >= 1 && rows >= 1 && columns <= 20 && rows <= 20
	const hasImages = uploadedImages.length > 0
	
	splitButton.disabled = !isValid || !hasImages
	updateInfoPanel()
	
	if (isValid && hasImages) {
		splitButton.style.opacity = '1'
	}
}

// Update info panel with current values
function updateInfoPanel() {
	const columns = parseInt(document.getElementById('columns').value) || 2
	const rows = parseInt(document.getElementById('rows').value) || 2
	
	imageCount.textContent = uploadedImages.length
	gridInfo.textContent = `${columns}×${rows}`
	totalParts.textContent = columns * rows * uploadedImages.length
	
	// Update grid preview
	updateGridPreview(columns, rows)
}

// Update grid preview visualization
function updateGridPreview(columns, rows) {
	const gridPreview = document.getElementById('gridPreview')
	
	// Add updating animation
	gridPreview.classList.add('updating')
	
	// Clear existing cells
	gridPreview.innerHTML = ''
	
	// Set grid template
	gridPreview.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
	gridPreview.style.gridTemplateRows = `repeat(${rows}, 1fr)`
	
	// Create grid cells
	const totalCells = columns * rows
	for (let i = 0; i < totalCells; i++) {
		const cell = document.createElement('div')
		cell.classList.add('grid-cell')
		cell.title = `Part ${i + 1} of ${totalCells}`
		
		// Add staggered animation delay
		cell.style.animationDelay = `${(i * 0.02)}s`
		
		gridPreview.appendChild(cell)
	}
	
	// Remove updating class after animation
	setTimeout(() => {
		gridPreview.classList.remove('updating')
	}, 300)
}

// Split all images with enhanced feedback
function splitAllImages() {
	const columns = parseInt(document.getElementById('columns').value)
	const rows = parseInt(document.getElementById('rows').value)
	
	if (columns < 1 || rows < 1 || columns > 20 || rows > 20) {
		showToast('Please enter valid numbers (1-20) for columns and rows', 'error')
		return
	}
	
	if (uploadedImages.length === 0) {
		showToast('Please upload images first', 'error')
		return
	}
	
	toggleLoader(true)
	showToast(`Splitting ${uploadedImages.length} image(s) into ${columns}×${rows} grids...`, 'info')
	
	// Use setTimeout to allow UI to update
	setTimeout(() => {
		try {
			uploadedImages.forEach((imgData, index) => {
				splitImage(imgData.element, columns, rows, index, imgData.name)
			})
			
			toggleLoader(false)
			showToast('Images split successfully!', 'success')
		} catch (error) {
			toggleLoader(false)
			showToast('Error splitting images: ' + error.message, 'error')
		}
	}, 100)
}

// Enhanced split image function
function splitImage(img, columns, rows, imageIndex, imageName) {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	const splitWidth = Math.floor(img.width / columns)
	const splitHeight = Math.floor(img.height / rows)
	
	const splitImagesGrid = document.getElementById(`splitImages-${imageIndex}`)
	splitImagesGrid.innerHTML = ''
	splitImagesGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
	
	const splitImages = []
	
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < columns; x++) {
			canvas.width = splitWidth
			canvas.height = splitHeight
			ctx.drawImage(img, x * splitWidth, y * splitHeight, splitWidth, splitHeight, 0, 0, splitWidth, splitHeight)
			
			const splitImage = document.createElement('img')
			splitImage.src = canvas.toDataURL('image/png', 0.9)
			splitImage.classList.add('split-image')
			splitImage.title = `Part ${y * columns + x + 1} of ${columns}×${rows}`
			splitImagesGrid.appendChild(splitImage)
			
			const cleanName = imageName.replace(/\.[^/.]+$/, '') // Remove extension
			splitImages.push({
				dataUrl: canvas.toDataURL('image/png', 0.9),
				fileName: `${cleanName}_part_${String(y * columns + x + 1).padStart(2, '0')}.png`
			})
		}
	}
	
	// Enhanced download button
	const downloadAllButton = document.createElement('button')
	downloadAllButton.innerHTML = `
		<span>📦</span>
		<span>Download All (${splitImages.length} images)</span>
	`
	downloadAllButton.classList.add('download-all')
	downloadAllButton.onclick = () => downloadAllSplits(splitImages, imageIndex, imageName)
	splitImagesGrid.appendChild(downloadAllButton)
}

// Enhanced download function
async function downloadAllSplits(splitImages, imageIndex, imageName) {
	try {
		toggleLoader(true)
		showToast('Preparing download...', 'info')
		
		const zip = new JSZip()
		const cleanName = imageName.replace(/\.[^/.]+$/, '')
		
		splitImages.forEach(img => {
			const imageData = img.dataUrl.split(',')[1]
			zip.file(img.fileName, imageData, { base64: true })
		})
		
		const content = await zip.generateAsync({ 
			type: "blob",
			compression: "DEFLATE",
			compressionOptions: { level: 6 }
		})
		
		// Create download link
		const blobUrl = URL.createObjectURL(content)
		const tempLink = document.createElement('a')
		tempLink.href = blobUrl
		tempLink.download = `${cleanName}_splits.zip`
		
		// Trigger download
		document.body.appendChild(tempLink)
		tempLink.click()
		document.body.removeChild(tempLink)
		
		// Cleanup
		setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
		
		toggleLoader(false)
		showToast(`Downloaded ${splitImages.length} images successfully!`, 'success')
		
	} catch (error) {
		toggleLoader(false)
		showToast('Download failed: ' + error.message, 'error')
	}
}

// Enhanced loader with better animation
function toggleLoader(show) {
	const loader = document.getElementById('loader')
	if (show) {
		loader.style.display = 'flex'
		setTimeout(() => loader.style.opacity = '1', 10)
	} else {
		loader.style.opacity = '0'
		setTimeout(() => loader.style.display = 'none', 300)
	}
}

// Toast notification system
function showToast(message, type = 'info') {
	// Remove existing toast
	const existingToast = document.querySelector('.toast')
	if (existingToast) {
		existingToast.remove()
	}
	
	const toast = document.createElement('div')
	toast.className = `toast toast-${type}`
	toast.textContent = message
	
	// Toast styles
	toast.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		color: white;
		font-weight: 500;
		z-index: 10000;
		transform: translateX(100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
		max-width: 350px;
		word-wrap: break-word;
	`
	
	// Set background based on type
	const backgrounds = {
		success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
		error: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
		info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
	}
	
	toast.style.background = backgrounds[type] || backgrounds.info
	
	document.body.appendChild(toast)
	
	// Animate in
	setTimeout(() => toast.style.transform = 'translateX(0)', 10)
	
	// Auto remove
	setTimeout(() => {
		toast.style.transform = 'translateX(100%)'
		setTimeout(() => toast.remove(), 300)
	}, 3000)
}

// Utility function to format file size
function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	initializeEventListeners()
	// Initialize grid preview with default values
	updateGridPreview(2, 2)
}) 