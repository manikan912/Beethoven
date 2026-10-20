'use strict';

const galleryPhotos = [
	{
		src: 'img/gallery/photo-1.webp',
		alt: 'Beethoven Music School photo 1',
		caption: 'Beethoven Music School photo 1'
	},
	{
		src: 'img/gallery/photo-2.webp',
		alt: 'Beethoven Music School photo 2',
		caption: 'Beethoven Music School photo 2'
	},
	{
		src: 'img/gallery/photo-3.webp',
		alt: 'Beethoven Music School photo 3',
		caption: 'Beethoven Music School photo 3'
	}
];

const galleryGrid = document.getElementById('gallery-grid');
const lightbox = document.getElementById('gallery-lightbox');
const lightboxImage = document.getElementById('gallery-lightbox-image');
const lightboxCaption = document.getElementById('gallery-lightbox-caption');
const lightboxCount = document.getElementById('gallery-lightbox-count');
let activePhotoIndex = 0;
let returnFocusElement;

function renderPhoto(index) {
	activePhotoIndex = (index + galleryPhotos.length) % galleryPhotos.length;
	const photo = galleryPhotos[activePhotoIndex];
	lightboxImage.src = photo.src;
	lightboxImage.alt = photo.alt;
	lightboxCaption.textContent = photo.caption;
	lightboxCount.textContent = `${activePhotoIndex + 1} / ${galleryPhotos.length}`;
}

galleryPhotos.forEach((photo, index) => {
	const button = document.createElement('button');
	button.className = 'gallery-thumb';
	button.type = 'button';
	button.setAttribute('aria-label', `Open photo ${index + 1} of ${galleryPhotos.length}`);

	const image = document.createElement('img');
	image.src = photo.src;
	image.alt = photo.alt;
	image.loading = 'lazy';
	image.decoding = 'async';
	if (index === 0) {
		image.fetchPriority = 'high';
	}

	const openIcon = document.createElement('span');
	openIcon.className = 'gallery-thumb-open';
	openIcon.setAttribute('aria-hidden', 'true');
	openIcon.innerHTML = '<i class="fa fa-search-plus"></i>';

	button.append(image, openIcon);
	button.addEventListener('click', () => {
		returnFocusElement = button;
		renderPhoto(index);
		lightbox.showModal();
	});
	galleryGrid.append(button);
});

document.getElementById('gallery-prev').addEventListener('click', () => {
	renderPhoto(activePhotoIndex - 1);
});

document.getElementById('gallery-next').addEventListener('click', () => {
	renderPhoto(activePhotoIndex + 1);
});

document.getElementById('gallery-close').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', event => {
	if (event.target === lightbox) {
		lightbox.close();
	}
});

lightbox.addEventListener('close', () => returnFocusElement?.focus());

document.addEventListener('keydown', event => {
	if (!lightbox.open) {
		return;
	}
	if (event.key === 'ArrowLeft') {
		renderPhoto(activePhotoIndex - 1);
	} else if (event.key === 'ArrowRight') {
		renderPhoto(activePhotoIndex + 1);
	}
});