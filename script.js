let uploadedImages = []

document.getElementById('imageInput').addEventListener('change', function (e) {
	const files = e.target.files
	uploadedImages = []
	const imagesContainer = document.getElementById('imagesContainer')
	imagesContainer.innerHTML = ''

	toggleLoader(true) // Show loader on image upload start

	// Set up a counter to track when all images are loaded
	let imagesLoaded = 0
	for (let file of files) {
		const reader = new FileReader()
		reader.onload = function (event) {
			const img = new Image()
			img.onload = function () {
				uploadedImages.push(img)
				displayImage(img, uploadedImages.length - 1)

				imagesLoaded++
				if (imagesLoaded === files.length) {
					toggleLoader(false) // Hide loader when all images are rendered
				}
			}
			img.src = event.target.result
		}
		reader.readAsDataURL(file)
	}
})

function displayImage(img, index) {
	const imagesContainer = document.getElementById('imagesContainer')
	const imageContainer = document.createElement('div')
	imageContainer.classList.add('image-container')

	const preview = document.createElement('img')
	preview.src = img.src
	preview.classList.add('preview')

	const splitImagesGrid = document.createElement('div')
	splitImagesGrid.classList.add('split-images-grid')
	splitImagesGrid.id = `splitImages-${index}`

	imageContainer.appendChild(preview)
	imageContainer.appendChild(splitImagesGrid)
	imagesContainer.appendChild(imageContainer)
}

function splitAllImages() {
	const columns = parseInt(document.getElementById('columns').value)
	const rows = parseInt(document.getElementById('rows').value)
	if (columns < 1 || rows < 1) {
		alert('Please enter valid numbers for columns and rows (minimum 1).')
		return
	}

	toggleLoader(true) // Show loader on split
	uploadedImages.forEach((img, index) => splitImage(img, columns, rows, index))
	toggleLoader(false) // Hide loader after splitting
}


/**
 * Splits an image into a grid of images.
 * @param {HTMLImageElement} img The image to split.
 * @param {number} columns The number of columns in the grid.
 * @param {number} rows The number of rows in the grid.
 * @param {number} imageIndex The index of the image.
 */
function splitImage(img, columns, rows, imageIndex) {
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
			splitImage.src = canvas.toDataURL('image/png')
			splitImage.classList.add('split-image')
			splitImagesGrid.appendChild(splitImage)

			splitImages.push({
				dataUrl: canvas.toDataURL('image/png'),
				fileName: `image-${imageIndex + 1}-${y * columns + x + 1}.png`
			})
		}
	}

	const downloadAllButton = document.createElement('button')
	downloadAllButton.innerHTML = `Download All Splits`
	downloadAllButton.classList.add('download-all')
	downloadAllButton.onclick = () => downloadAllSplits(splitImages, imageIndex)
	splitImagesGrid.appendChild(downloadAllButton)
}

async function downloadAllSplits(splitImages, imageIndex) {
	toggleLoader(true) // Show loader on download
	const zip = new JSZip()

	splitImages.forEach(img => {
		const imageData = img.dataUrl.split(',')[1]
		zip.file(img.fileName, imageData, { base64: true })
	})

	const content = await zip.generateAsync({ type: "blob" })

	const blobUrl = URL.createObjectURL(content)

	const tempLink = document.createElement('a')
	tempLink.href = blobUrl
	tempLink.download = `image-${imageIndex + 1}-splits.zip`
	document.body.appendChild(tempLink) // Required for Firefox

	tempLink.click()

	document.body.removeChild(tempLink) // Cleanup
	URL.revokeObjectURL(blobUrl)

	toggleLoader(false) // Hide loader after download
}

// Toggle loader visibility
function toggleLoader(show) {
	const loader = document.getElementById('loader')
	loader.style.display = show ? 'block' : 'none'
} 